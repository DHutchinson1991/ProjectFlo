import { Prisma } from '@prisma/client';

export type SubjectWithDetails = Prisma.PackageDaySubjectGetPayload<{
  include: {
    role_template: true;
  };
}>;

export type SceneSubjectWithDetails = Prisma.FilmSceneMomentSubjectGetPayload<{
  include: {
    subject: {
      include: {
        role_template: true;
      };
    };
  };
}>;
