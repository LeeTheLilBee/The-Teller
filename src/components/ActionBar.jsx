import { getActionsForDrawer } from "../config/workflowActions.js";
import ActionButton from "./ActionButton.jsx";

export default function ActionBar({ drawerKey, onAction }) {
  const actions = getActionsForDrawer(drawerKey);

  return (
    <div className="action-bar">
      <span>Available Actions</span>
      <div>
        {actions.map((action) => (
          <ActionButton key={action.key} action={action} onClick={onAction} />
        ))}
      </div>
    </div>
  );
}
