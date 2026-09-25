'use client';
import ProjectMasonryGrid from "./ProjectMasonryGrid";
import PasswordDialog from "./PasswordDialog";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function ProjectSummary({
  MasonryImages = [], 
  ProjTitle, 
  ProjDesc, 
  hoverEffects = false, 
  projectLink, 
  requiresPassword = false
}) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (requiresPassword) {
      setShowPasswordDialog(true);
    } else {
      router.push(projectLink);
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordDialog(false);
    router.push(`${projectLink}?dialog=true`);
  };

  if (!projectLink) {
    // If no link, render as before (non-clickable)
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm text-slate-900">{ProjTitle}</h3>
            {requiresPassword && (
              <Lock size={12}  className="text-slate-400" />
            )}
          </div>
          <p className="text-slate-600 mt-1 text-xs">{ProjDesc}</p>
        </div>
        
        <ProjectMasonryGrid 
          lightboxImages={MasonryImages} 
          height={400}
          hoverEffects={hoverEffects}
        />
      </div>
    );
  }

  // For password-protected projects, use div to hide link preview
  // For regular projects, use Link for proper navigation
  if (requiresPassword) {
    return (
      <>
        <div 
          onClick={handleClick} 
          className="block cursor-pointer"
        >
          <div className="space-y-4 group">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm text-slate-900 group-hover:font-semibold transition-all">
                  {ProjTitle}
                </h3>
                <Lock size={12} strokeWidth={2.5} className="text-slate-600" />
              </div>
              <p className="text-slate-600 mt-1 text-xs">{ProjDesc}</p>
            </div>
            
            <ProjectMasonryGrid 
              lightboxImages={MasonryImages} 
              height={400}
              hoverEffects={hoverEffects}
            />
          </div>
        </div>

        <PasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onSuccess={handlePasswordSuccess}
          projectTitle={ProjTitle}
        />
      </>
    );
  }

  // For non-password projects, use Link for proper navigation
  return (
    <Link href={projectLink} className="block">
      <div className="space-y-4 cursor-pointer group">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm text-slate-900 group-hover:font-semibold transition-all">
              {ProjTitle}
            </h3>
          </div>
          <p className="text-slate-600 mt-1 text-xs">{ProjDesc}</p>
        </div>

        <ProjectMasonryGrid
          lightboxImages={MasonryImages}
          height={400}
          hoverEffects={hoverEffects}
        />
      </div>
    </Link>
  );
}