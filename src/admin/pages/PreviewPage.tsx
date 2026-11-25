import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ClonedPage } from '../../components/cloned/ClonedPage';
import { useDatabase } from '../../services/store';

export function PreviewPage() {
  const { id } = useParams();
  const db = useDatabase();
  const pageId = Number(id);
  const page = db.pages.find((item) => item.id === pageId);
  const editorPath = page?.kind === 'template' ? `/admin/pages/${pageId}` : `/admin/homepage/${pageId}`;

  return (
    <div className="adm-preview">
      <div className="adm-preview__bar">
        <Link to={editorPath}>
          <ArrowLeft size={14} /> Kembali ke editor
        </Link>
        <span>Mode preview · perubahan tersimpan langsung terlihat</span>
      </div>
      <ClonedPage pageId={pageId} preview />
    </div>
  );
}
