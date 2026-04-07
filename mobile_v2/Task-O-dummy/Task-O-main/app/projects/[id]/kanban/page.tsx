import ProjectKanbanClient from './ProjectKanbanClient'

export default async function ProjectKanbanPage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const teamId = searchParams?.teamId as string | undefined
    return <ProjectKanbanClient projectId={params.id} initialTeamId={teamId} />
}
