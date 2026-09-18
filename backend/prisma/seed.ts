// prisma/seed.ts
//
// Seeds the reference data every environment needs before the app is usable:
//   1. Roles          — the 6 roles from 02-business-requirements.md §3
//   2. Permissions     — resource:action codes referenced by authorize.ts middleware
//   3. Role→Permission mapping — matches each role's responsibilities in the BRD
//   4. Units           — common inventory units of measure
//   5. One Administrator account — following the exact provisioning flow described
//      in 18-security-design.md: a random temporary password is generated, hashed,
//      and printed ONCE to the console. It is never hard-coded or committed.
//
// Run with: npx prisma db seed
// (safe to run multiple times — every step uses upsert / skipDuplicates)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const BCRYPT_COST = 12; // matches 18-security-design.md

// ---------- 1. Roles ----------
// Names match 02-business-requirements.md §3 exactly, except "Executive / Manager"
// is stored as "Executive" (JWT role claims and route guards read better as single
// tokens; the BRD's slash-name was a display label, not a literal identifier).
const ROLES = [
  { name: "Administrator", description: "Manages users, roles, and system settings" },
  { name: "Executive", description: "Read-only access to all dashboards and reports" },
  { name: "Purchasing Officer", description: "Manages suppliers and purchase orders" },
  { name: "Warehouse Staff", description: "Manages physical stock at assigned warehouse(s)" },
  { name: "Inventory Manager", description: "Oversees inventory health across warehouses; approves adjustments" },
  { name: "Auditor", description: "Read-only access to audit logs, activity logs, and reports" },
] as const;

// ---------- 2. Permissions ----------
// Codes are resource:action pairs, one per meaningful capability in 15-api-design.md.
// This exact list isn't dictated by the docs (no enumerated permission table exists
// yet), so it's derived here from the API endpoint list + each role's responsibilities
// in the BRD. Extend this list as new endpoints are added — every route's `authorize()`
// call should reference a code that exists here.
const PERMISSIONS = [
  // Users & roles (Administrator only)
  { code: "users:manage", description: "Create/update users, assign roles and warehouses, reset passwords" },
  { code: "settings:manage", description: "View/update system-wide settings" },

  // Master data
  { code: "products:read", description: "View products" },
  { code: "products:write", description: "Create/update/delete products, import/export" },
  { code: "categories:manage", description: "Manage categories" },
  { code: "brands:manage", description: "Manage brands" },
  { code: "units:manage", description: "Manage units of measure" },
  { code: "suppliers:read", description: "View suppliers and supplier-product data" },
  { code: "suppliers:write", description: "Manage suppliers and supplier-product data" },
  { code: "warehouses:manage", description: "Manage warehouses and locations" },
  { code: "warehouses:read", description: "View warehouses and locations" },

  // Purchasing
  { code: "purchase_orders:read", description: "View purchase orders" },
  { code: "purchase_orders:write", description: "Create/edit/submit/cancel purchase orders" },
  { code: "goods_receipts:create", description: "Record a goods receipt against a PO" },

  // Inventory
  { code: "stock:read", description: "View stock balances, movements, and health" },
  { code: "stock:transfer", description: "Transfer stock between warehouses" },
  { code: "stock:outbound", description: "Record manual outbound stock movements" },
  { code: "stock:adjust", description: "Create manual stock adjustments" },

  // Dashboards
  { code: "dashboards:executive", description: "View the executive dashboard" },
  { code: "dashboards:inventory", description: "View the inventory dashboard" },
  { code: "dashboards:warehouse", description: "View warehouse dashboards" },
  { code: "dashboards:purchasing", description: "View the purchasing dashboard" },

  // System / audit
  { code: "audit_logs:read", description: "View audit logs" },
  { code: "activity_logs:read", description: "View activity logs" },
  { code: "files:upload", description: "Upload file attachments" },
  { code: "notifications:read", description: "View own notifications" },
] as const;

// ---------- 3. Role -> Permission mapping ----------
// Administrator gets every permission that exists (least-privilege default per
// 18-security-design.md means every OTHER role starts scoped to only what its BRD
// row describes).
const ALL_PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  Administrator: ALL_PERMISSION_CODES,

  Executive: [
    "products:read",
    "suppliers:read",
    "warehouses:read",
    "purchase_orders:read",
    "stock:read",
    "dashboards:executive",
    "dashboards:inventory",
    "dashboards:warehouse",
    "dashboards:purchasing",
    "notifications:read",
  ],

  "Purchasing Officer": [
    "products:read",
    "suppliers:read",
    "suppliers:write",
    "warehouses:read",
    "purchase_orders:read",
    "purchase_orders:write",
    "dashboards:purchasing",
    "notifications:read",
  ],

  "Warehouse Staff": [
    "products:read",
    "warehouses:read",
    "purchase_orders:read",
    "goods_receipts:create",
    "stock:read",
    "stock:transfer",
    "stock:outbound",
    "dashboards:warehouse",
    "notifications:read",
  ],

  "Inventory Manager": [
    "products:read",
    "products:write",
    "categories:manage",
    "brands:manage",
    "units:manage",
    "warehouses:read",
    "stock:read",
    "stock:outbound",
    "stock:adjust",
    "dashboards:inventory",
    "notifications:read",
  ],

  Auditor: [
    "audit_logs:read",
    "activity_logs:read",
    "dashboards:executive",
    "dashboards:inventory",
    "dashboards:warehouse",
    "dashboards:purchasing",
    "notifications:read",
  ],
};

// ---------- 4. Units of measure ----------
const UNITS = [
  { name: "Piece", abbreviation: "pc" },
  { name: "Box", abbreviation: "box" },
  { name: "Carton", abbreviation: "ctn" },
  { name: "Kilogram", abbreviation: "kg" },
  { name: "Gram", abbreviation: "g" },
  { name: "Liter", abbreviation: "L" },
  { name: "Milliliter", abbreviation: "mL" },
  { name: "Pack", abbreviation: "pack" },
  { name: "Set", abbreviation: "set" },
  { name: "Roll", abbreviation: "roll" },
];

// Generates a random password that comfortably satisfies the ≥8-character policy
// in 22-validation-rules.md, with mixed character classes for good hygiene even
// though the docs don't mandate complexity beyond length.
function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid visual ambiguity
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 12 }, () => pick(all));

  // Shuffle so the required characters aren't always in the same position
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

async function main() {
  console.log("Seeding roles...");
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log("Seeding permissions...");
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }

  console.log("Wiring role -> permission grants...");
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    for (const code of codes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seeding units...");
  for (const unit of UNITS) {
    const existing = await prisma.unit.findFirst({ where: { name: unit.name } });
    if (!existing) {
      await prisma.unit.create({ data: unit });
    }
  }

  console.log("Ensuring an initial Administrator account exists...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@eibi.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Administrator account already exists (${adminEmail}) — skipping creation.`);
  } else {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_COST);

    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Administrator" } });

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: "System Administrator",
        mustChangePassword: true,
        roles: { create: { roleId: adminRole.id } },
      },
    });

    // Printed exactly once, per 18-security-design.md's provisioning flow — this
    // value is never stored anywhere else. Relay it to whoever logs in first,
    // then it's gone; must_change_password forces a change on first login.
    console.log("");
    console.log("========================================================");
    console.log(" Administrator account created");
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${temporaryPassword}`);
    console.log(" This password is shown ONCE and is not stored anywhere.");
    console.log(" You will be required to change it on first login.");
    console.log("========================================================");
    console.log("");
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
