import { Prisma } from '@prisma/client';

export type SubjectWithDetails = Prisma.FilmSubjectGetPayload<{
  include: {
    role_template: true;
  };
}>;

export type SceneSubjectWithDetails = Prisma.FilmSceneSubjectGetPayload<{
  include: {
    subject: {
      include: {
        role_template: true;
      };
    };
  };
}>;
