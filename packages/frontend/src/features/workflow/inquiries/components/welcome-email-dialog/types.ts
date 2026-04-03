export interface WelcomeEmailDraft {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
}

export interface WelcomeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  draft: WelcomeEmailDraft | null;
  onDraftChange: (draft: WelcomeEmailDraft) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}
