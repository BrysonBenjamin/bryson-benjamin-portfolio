import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { FeedDetail } from "../types";

type TaskDetailProps = {
  item: FeedDetail;
};

function TaskDetail({ item }: TaskDetailProps) {
  const location = useLocation();

  return (
    <div className={`task-detail tone-${item.tone}`}>
      {item.parent && (
        <Link className="task-detail-parent" to={`/log/${item.parent.id}`} state={{ background: location }}>
          <ArrowUpRight size={14} aria-hidden="true" />
          <span>
            Part of {item.parent.id}: {item.parent.title}
          </span>
        </Link>
      )}
      <div className="task-detail-meta">
        <span>{item.id}</span>
        <span>{item.state}</span>
      </div>
      <h1>{item.title}</h1>
      <p className="task-detail-body">{item.body}</p>
      {item.links.length > 0 && (
        <div className="task-detail-links">
          <span className="task-detail-links-label">Documentation</span>
          <ul>
            {item.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer noopener">
                  <ExternalLink size={14} aria-hidden="true" />
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.subtasks.length > 0 && (
        <div className="task-detail-subtasks">
          <span className="task-detail-links-label">Subtasks</span>
          <ul>
            {item.subtasks.map((subtask) => (
              <li key={subtask.id} className={`tone-${subtask.tone}`}>
                <Link to={`/log/${subtask.id}`} state={{ background: location }}>
                  <span className="task-detail-subtask-meta">
                    <span>{subtask.id}</span>
                    <span>{subtask.state}</span>
                  </span>
                  <span className="task-detail-subtask-title">{subtask.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TaskDetail;
