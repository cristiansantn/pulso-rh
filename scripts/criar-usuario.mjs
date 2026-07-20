import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const content = readFileSync(".env.local", "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^(\w+)=(.+)$/);
      if (match) process.env[match[1]] ??= match[2];
    }
  } catch {
    // .env.local is optional if vars are already set
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
  );
  process.exit(1);
}

const email = process.argv[2] || "cristiansantana1807@gmail.com";
const password = process.argv[3] || "pulso2026";

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log("Usuário criado com sucesso!");
console.log(`  Email: ${email}`);
console.log(`  Senha: ${password}`);
console.log(`  ID:    ${data.user.id}`);
