import { groupDrawerTabs } from "../lib/drawerOrganization.js";

export default function DrawerTabGroups({ drawers, activeDrawer, setActiveDrawer }) {
  const groups = groupDrawerTabs(drawers);

  return (
    <div className="drawer-tab-groups">
      {groups.map((group) => (
        <div className="drawer-tab-group" key={group.group}>
          <span>{group.group}</span>
          <div>
            {group.tabs.map((tab) => (
              <button
                key={tab.key}
                className={activeDrawer === tab.key ? "drawer-tab active" : "drawer-tab"}
                onClick={() => setActiveDrawer(tab.key)}
                type="button"
              >
                {tab.label}
                <i />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
