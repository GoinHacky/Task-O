import DashboardLayout from '@/components/DashboardLayout'

export default function KanbanLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
