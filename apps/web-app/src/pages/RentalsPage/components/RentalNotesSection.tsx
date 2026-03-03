import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RentalNotesSectionProps {
  notes: string;
  onChangeNotes: (value: string) => void;
}

export function RentalNotesSection({
  notes,
  onChangeNotes,
}: RentalNotesSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Notas (opcional)</Label>
      <Textarea
        placeholder="Observaciones..."
        value={notes}
        onChange={(event) => onChangeNotes(event.target.value)}
        className="min-h-[80px] resize-none"
      />
    </div>
  );
}
