import { Sidebar } from '@/components/layout/Sidebar'
import { DirRoot } from '@/components/layout/DirRoot'
import { LanguageProvider } from '@/i18n/LanguageContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DirRoot>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
          {children}
        </div>
      </DirRoot>
    </LanguageProvider>
  )
}
