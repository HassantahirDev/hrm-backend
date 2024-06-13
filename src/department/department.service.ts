import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Department } from '.prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({ data: createDepartmentDto });
  }

  async findAll(): Promise<Department[]> {
    return this.prisma.department.findMany();
  }

  async findOne(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({ where: { id } });
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    return this.prisma.department.update({ where: { id }, data: updateDepartmentDto });
  }

  async remove(id: string): Promise<Department> {
    return this.prisma.department.delete({ where: { id } });
  }
}
