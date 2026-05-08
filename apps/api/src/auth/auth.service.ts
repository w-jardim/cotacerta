import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário como GESTOR_MASTER por padrão
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'GESTOR_MASTER',
      },
    });

    // Gerar token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo ou bloqueado');
    }

    // Verificar senha
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    // Remove passwordHash antes de retornar
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
