import DashboardLayout from '@/components/DashboardLayout'

export default function TasksLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
