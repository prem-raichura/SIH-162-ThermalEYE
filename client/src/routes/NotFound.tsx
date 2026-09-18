import { Link } from 'react-router-dom'
import { Brand } from '@/components/shell/Brand'
import { useRoleStore } from '@/store/useRole'

export function NotFound() {
  const roleId = useRoleStore((s) => s.roleId)
  const home = roleId ? `/${roleId}` : '/login'

  return (
    <div className="bg-paper text-ink grid min-h-dvh place-items-center px-6">
      <div className="max-w-[46ch] text-center">
        <Brand size="lg" className="justify-center" />
        <h1 className="font-display mt-8 text-[32px]">That page is not part of this view.</h1>
        <p className="text-ink-soft mt-3 text-[14px]">
          Each organisation sees only its own sections. Go back to your overview and pick from the rail.
        </p>
        <Link
          to={home}
          className="bg-terracotta mt-7 inline-flex rounded-[10px] px-5 py-2.5 text-[13.5px] text-white"
        >
          Back to the overview
        </Link>
      </div>
    </div>
  )
}
