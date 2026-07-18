import { ExternalLink } from "lucide-react";
import type { FeedDetail } from "../types";

type TaskDetailProps = {
  item: FeedDetail;
};

function TaskDetail({ item }: TaskDetailProps) {
  return (
    <div className={`task-detail tone-${item.tone}`}>
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
    </div>
  );
}

export default TaskDetail;
