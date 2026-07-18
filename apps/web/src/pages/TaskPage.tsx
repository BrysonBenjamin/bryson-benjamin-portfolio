import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useFeedItem } from "../hooks/useFeedItem";
import TaskDetail from "../components/TaskDetail";

function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const { item, status } = useFeedItem(id);

  return (
    <section className="task-page" aria-label="Task detail">
      <Link className="task-page-back" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to log</span>
      </Link>
      {status === "loading" && <p className="task-overlay-state">Loading...</p>}
      {status === "not-found" && <p className="task-overlay-state">This task could not be found.</p>}
      {item && <TaskDetail item={item} />}
    </section>
  );
}

export default TaskPage;
