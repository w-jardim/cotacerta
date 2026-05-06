import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se já existe um admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@cotacerta.com' },
  });

  if (existingAdmin) {
    console.log('✅ Usuário admin já existe');
    return;
  }

  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash('admin123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin CotaCerta',
      email: 'admin@cotacerta.com',
      passwordHash: hashedPassword,
      role: 'ADMIN_PLATFORM',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Usuário admin criado:');
  console.log('   Email: admin@cotacerta.com');
  console.log('   Senha: admin123456');
  console.log('   Role:', admin.role);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
