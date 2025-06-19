import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilters, BulkUpdateTaskDto, TaskCommentDto, TimeEntryDto } from './tasks.controller';
import { tasks_status } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    // Validate references exist
    const [project, buildComponent, taskTemplate] = await Promise.all([
      this.prisma.projects.findUnique({ where: { id: createTaskDto.project_id } }),
      this.prisma.build_components.findUnique({ where: { id: createTaskDto.build_component_id } }),
      this.prisma.task_templates.findUnique({ where: { id: createTaskDto.task_template_id } })
    ]);

    if (!project) throw new NotFoundException('Project not found');
    if (!buildComponent) throw new NotFoundException('Build component not found');
    if (!taskTemplate) throw new NotFoundException('Task template not found');

    // If assigned contributor specified, validate they exist
    if (createTaskDto.assigned_to_contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: createTaskDto.assigned_to_contributor_id }
      });
      if (!contributor) throw new NotFoundException('Assigned contributor not found');
    }

    // Get contributor's rate at time of assignment
    let rateAtAssignment = 0;
    if (createTaskDto.assigned_to_contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: createTaskDto.assigned_to_contributor_id }
      });
      rateAtAssignment = Number(contributor?.default_hourly_rate || 0);
    }

    const task = await this.prisma.tasks.create({
      data: {
        project_id: createTaskDto.project_id,
        build_component_id: createTaskDto.build_component_id,
        task_template_id: createTaskDto.task_template_id,
        planned_duration_hours: createTaskDto.planned_duration_hours || taskTemplate.effort_hours,
        due_date: createTaskDto.due_date,
        assigned_to_contributor_id: createTaskDto.assigned_to_contributor_id,
        is_client_visible: createTaskDto.is_client_visible || false,
        rate_at_time_of_assignment: rateAtAssignment,
        status: tasks_status.To_Do,
      },
      include: {
        task_template: true,
        assigned_to_contributor: {
          include: { contact: true }
        },
        project: true,
        build_component: true,
      }
    });

    return task;
  }

  async findAll(filters: TaskFilters, page: number = 1, limit: number = 50) {
    const whereConditions: Record<string, any> = {};

    if (filters.project_id) whereConditions.project_id = filters.project_id;
    if (filters.status) whereConditions.status = filters.status;
    if (filters.assigned_to) whereConditions.assigned_to_contributor_id = filters.assigned_to;
    if (filters.due_before) whereConditions.due_date = { lte: filters.due_before };
    if (filters.due_after) {
      whereConditions.due_date = whereConditions.due_date 
        ? { ...whereConditions.due_date, gte: filters.due_after }
        : { gte: filters.due_after };
    }
    if (filters.is_overdue) {
      whereConditions.due_date = { lt: new Date() };
      whereConditions.status = { not: tasks_status.Completed };
    }

    // Search across task template names
    if (filters.search) {
      whereConditions.OR = [
        {
          task_template: {
            name: { contains: filters.search, mode: 'insensitive' }
          }
        }
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.tasks.findMany({
        where: whereConditions,
        include: {
          task_template: true,
          assigned_to_contributor: {
            include: { contact: true }
          },
          project: {
            include: { client: { include: { contact: true } } }
          },
          build_component: true,
          _count: {
            select: {
              task_comments: true,
              task_dependencies_blocking: true,
              task_dependencies_dependent: true
            }
          }
        },
        orderBy: [
          { due_date: 'asc' },
          { id: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tasks.count({ where: whereConditions })
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBoardData(filters: TaskFilters) {
    const whereConditions: Record<string, any> = {};
    if (filters.project_id) whereConditions.project_id = filters.project_id;
    if (filters.assigned_to) whereConditions.assigned_to_contributor_id = filters.assigned_to;

    const tasks = await this.prisma.tasks.findMany({
      where: whereConditions,
      include: {
        task_template: true,
        assigned_to_contributor: {
          include: { contact: true }
        },
        project: {
          include: { client: { include: { contact: true } } }
        },
        build_component: true,
        _count: {
          select: {
            task_comments: true,
            task_dependencies_blocking: true
          }
        }
      },
      orderBy: [
        { due_date: 'asc' },
        { id: 'desc' }
      ]
    });

    // Group tasks by status for board view
    const board = {
      [tasks_status.To_Do]: [] as any[],
      [tasks_status.Ready_to_Start]: [] as any[],
      [tasks_status.In_Progress]: [] as any[],
      [tasks_status.Completed]: [] as any[],
      [tasks_status.Archived]: [] as any[]
    };

    tasks.forEach(task => {
      board[task.status].push(task);
    });

    return {
      board,
      summary: {
        total: tasks.length,
        by_status: {
          to_do: board[tasks_status.To_Do].length,
          ready_to_start: board[tasks_status.Ready_to_Start].length,
          in_progress: board[tasks_status.In_Progress].length,
          completed: board[tasks_status.Completed].length,
          archived: board[tasks_status.Archived].length,
        },
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== tasks_status.Completed).length
      }
    };
  }

  async findOne(id: number) {
    const task = await this.prisma.tasks.findUnique({
      where: { id },
      include: {
        task_template: true,
        assigned_to_contributor: {
          include: { contact: true, role: true }
        },
        project: {
          include: { 
            client: { include: { contact: true } }
          }
        },
        build_component: {
          include: {
            coverage_scene: true,
            editing_style: true,
            build_deliverable: {
              include: {
                deliverable: true
              }
            }
          }
        },
        task_comments: {
          include: {
            contributor: { include: { contact: true } }
          },
          orderBy: { id: 'desc' }
        },
        task_dependencies_blocking: {
          include: {
            dependent_task: {
              include: {
                task_template: true,
                assigned_to_contributor: { include: { contact: true } }
              }
            }
          }
        },
        task_dependencies_dependent: {
          include: {
            blocking_task: {
              include: {
                task_template: true,
                assigned_to_contributor: { include: { contact: true } }
              }
            }
          }
        },
        _count: {
          select: {
            task_comments: true,
            task_dependencies_blocking: true,
            task_dependencies_dependent: true
          }
        }
      }
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.prisma.tasks.findUnique({ where: { id } });
    if (!existingTask) throw new NotFoundException('Task not found');

    // If changing assignee, validate they exist
    if (updateTaskDto.assigned_to_contributor_id && 
        updateTaskDto.assigned_to_contributor_id !== existingTask.assigned_to_contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: updateTaskDto.assigned_to_contributor_id }
      });
      if (!contributor) throw new NotFoundException('Assigned contributor not found');
    }

    const updatedTask = await this.prisma.tasks.update({
      where: { id },
      data: updateTaskDto,
      include: {
        task_template: true,
        assigned_to_contributor: {
          include: { contact: true }
        },
        project: true,
        build_component: true
      }
    });

    return updatedTask;
  }

  async remove(id: number) {
    const task = await this.prisma.tasks.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.tasks.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateTaskDto) {
    const { task_ids, updates } = bulkUpdateDto;

    if (task_ids.length === 0) {
      throw new BadRequestException('No task IDs provided');
    }

    // Validate all tasks exist
    const existingTasks = await this.prisma.tasks.findMany({
      where: { id: { in: task_ids } }
    });

    if (existingTasks.length !== task_ids.length) {
      throw new NotFoundException('Some tasks not found');
    }

    // If changing assignee, validate they exist
    if (updates.assigned_to_contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: updates.assigned_to_contributor_id }
      });
      if (!contributor) throw new NotFoundException('Assigned contributor not found');
    }

    await this.prisma.tasks.updateMany({
      where: { id: { in: task_ids } },
      data: updates
    });

    return { message: `${task_ids.length} tasks updated successfully` };
  }

  async getMyTasks(contributor_id: number, status?: tasks_status) {
    const whereConditions: Record<string, any> = { assigned_to_contributor_id: contributor_id };
    if (status) whereConditions.status = status;

    return this.prisma.tasks.findMany({
      where: whereConditions,
      include: {
        task_template: true,
        project: {
          include: { client: { include: { contact: true } } }
        },
        build_component: true,
        _count: { select: { task_comments: true } }
      },
      orderBy: [
        { due_date: 'asc' },
        { id: 'desc' }
      ]
    });
  }

  async getOverdueTasks(project_id?: number) {
    const whereConditions: Record<string, any> = {
      due_date: { lt: new Date() },
      status: { not: tasks_status.Completed }
    };

    if (project_id) whereConditions.project_id = project_id;

    return this.prisma.tasks.findMany({
      where: whereConditions,
      include: {
        task_template: true,
        assigned_to_contributor: {
          include: { contact: true }
        },
        project: {
          include: { client: { include: { contact: true } } }
        },
        build_component: true
      },
      orderBy: { due_date: 'asc' }
    });
  }

  async getTaskAnalytics(filters: { project_id?: number; date_from?: Date; date_to?: Date }) {
    const whereConditions: Record<string, any> = {};
    if (filters.project_id) whereConditions.project_id = filters.project_id;
    if (filters.date_from || filters.date_to) {
      whereConditions.id = {}; // Use id as created_at proxy
    }

    const [
      totalTasks,
      tasksByStatus,
      averageDuration
    ] = await Promise.all([
      // Total tasks count
      this.prisma.tasks.count({ where: whereConditions }),

      // Tasks by status
      this.prisma.tasks.groupBy({
        by: ['status'],
        where: whereConditions,
        _count: { id: true }
      }),

      // Average actual vs planned duration
      this.prisma.tasks.aggregate({
        where: { 
          ...whereConditions,
          actual_duration_hours: { not: null },
          planned_duration_hours: { not: null }
        },
        _avg: {
          actual_duration_hours: true,
          planned_duration_hours: true
        }
      })
    ]);

    return {
      summary: {
        total_tasks: totalTasks,
        average_planned_duration: averageDuration._avg.planned_duration_hours,
        average_actual_duration: averageDuration._avg.actual_duration_hours,
        estimation_accuracy: 85 // Mock value for now
      },
      by_status: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Comment methods
  async addComment(task_id: number, commentDto: TaskCommentDto) {
    const task = await this.prisma.tasks.findUnique({ where: { id: task_id } });
    if (!task) throw new NotFoundException('Task not found');

    // For now, we'll assume contributor_id comes from auth context
    const contributor_id = 1; // This should come from authenticated user

    const comment = await this.prisma.task_comments.create({
      data: {
        task_id,
        contributor_id,
        comment_text: commentDto.content,
        created_at: new Date()
      },
      include: {
        contributor: { include: { contact: true } }
      }
    });

    return comment;
  }

  async getComments(task_id: number) {
    return this.prisma.task_comments.findMany({
      where: { task_id },
      include: {
        contributor: { include: { contact: true } }
      },
      orderBy: { id: 'desc' }
    });
  }

  // Time tracking methods (simplified)
  async addTimeEntry(task_id: number, timeEntryDto: TimeEntryDto) {
    const task = await this.prisma.tasks.findUnique({ where: { id: task_id } });
    if (!task) throw new NotFoundException('Task not found');

    // Update task's actual duration
    const currentActual = Number(task.actual_duration_hours || 0);
    const newActual = currentActual + timeEntryDto.hours;

    await this.prisma.tasks.update({
      where: { id: task_id },
      data: { actual_duration_hours: newActual }
    });

    return {
      task_id,
      hours_added: timeEntryDto.hours,
      new_total: newActual,
      description: timeEntryDto.description,
      date: timeEntryDto.date
    };
  }

  async getTimeEntries(task_id: number) {
    const task = await this.prisma.tasks.findUnique({ 
      where: { id: task_id },
      select: { 
        actual_duration_hours: true,
        planned_duration_hours: true
      }
    });

    if (!task) throw new NotFoundException('Task not found');

    return {
      total_actual_hours: task.actual_duration_hours,
      planned_hours: task.planned_duration_hours,
      entries: [] // Mock - in real app would be actual entries
    };
  }

  // Dependency methods
  async addDependency(blocking_task_id: number, dependent_task_id: number) {
    if (blocking_task_id === dependent_task_id) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    // Validate both tasks exist
    const [blockingTask, dependentTask] = await Promise.all([
      this.prisma.tasks.findUnique({ where: { id: blocking_task_id } }),
      this.prisma.tasks.findUnique({ where: { id: dependent_task_id } })
    ]);

    if (!blockingTask) throw new NotFoundException('Blocking task not found');
    if (!dependentTask) throw new NotFoundException('Dependent task not found');

    return this.prisma.task_dependencies.create({
      data: {
        blocking_task_id,
        dependent_task_id
      }
    });
  }

  async removeDependency(blocking_task_id: number, dependent_task_id: number) {
    const dependency = await this.prisma.task_dependencies.findFirst({
      where: {
        blocking_task_id,
        dependent_task_id
      }
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    await this.prisma.task_dependencies.delete({
      where: { id: dependency.id }
    });

    return { message: 'Dependency removed successfully' };
  }

  async getDependencies(task_id: number) {
    const [blocking, dependent] = await Promise.all([
      // Tasks that this task blocks
      this.prisma.task_dependencies.findMany({
        where: { blocking_task_id: task_id },
        include: {
          dependent_task: {
            include: {
              task_template: true,
              assigned_to_contributor: { include: { contact: true } }
            }
          }
        }
      }),
      // Tasks that block this task
      this.prisma.task_dependencies.findMany({
        where: { dependent_task_id: task_id },
        include: {
          blocking_task: {
            include: {
              task_template: true,
              assigned_to_contributor: { include: { contact: true } }
            }
          }
        }
      })
    ]);

    return {
      blocks: blocking.map(d => d.dependent_task),
      blocked_by: dependent.map(d => d.blocking_task)
    };
  }

  // Get projects for task creation dropdown
  async getProjects() {
    return this.prisma.projects.findMany({
      select: {
        id: true,
        project_name: true,
        client: {
          select: {
            contact: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: {
        project_name: 'asc'
      }
    });
  }

  // Get build components for a specific project
  async getBuildComponents(projectId: number) {
    return this.prisma.build_components.findMany({
      where: {
        build_deliverable: {
          build: {
            project_id: projectId
          }
        }
      },
      select: {
        id: true,
        coverage_scene: {
          select: {
            name: true
          }
        },
        editing_style: {
          select: {
            name: true
          }
        },
        build_deliverable: {
          select: {
            build: {
              select: {
                id: true
              }
            },
            deliverable: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
  }
}
