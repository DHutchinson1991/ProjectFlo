import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFilmDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";

@Injectable()
export class FilmsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new film
   */
  async create(createDto: CreateFilmDto) {
    const film = await this.prisma.filmLibrary.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.findOne(film.id);
  }

  /**
   * Find all films
   */
  async findAll() {
    return this.prisma.filmLibrary.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find a specific film by ID
   */
  async findOne(id: number) {
    const film = await this.prisma.filmLibrary.findFirst({
      where: { id },
    });

    if (!film) {
      throw new NotFoundException(`Film with ID ${id} not found`);
    }

    return film;
  }

  /**
   * Update film
   */
  async update(id: number, updateData: UpdateFilmDto) {
    await this.prisma.filmLibrary.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return this.findOne(id);
  }

  /**
   * Delete film
   */
  async delete(id: number) {
    await this.prisma.filmLibrary.delete({
      where: { id },
    });

    return { message: "Film deleted successfully" };
  }
}
