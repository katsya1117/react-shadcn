import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const CollaborationPanel = ({
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdateCollaboratorRole,
  onSelectedCollaboratorChange,
  collaborators,
  folderName,
}: any) => (
  <div data-testid="collaboration-panel">
    <span data-testid="folder-name">{folderName}</span>
    {collaborators?.map((c: any, i: number) => (
      <span key={i} data-testid="collaborator">
        {c.collaborator.name}
        {c.isInherited ? "(inherited)" : ""}
        {c.sourcePath ? `[${c.sourcePath}]` : ""}
      </span>
    ))}
    <button
      onClick={() =>
        onSelectedCollaboratorChange({ value: "new-user", label: "New User" })
      }
    >
      select-collaborator
    </button>
    <button onClick={onAddCollaborator}>add-collaborator</button>
    <button
      onClick={() =>
        onRemoveCollaborator({
          id: "c1",
          name: "User1",
          type: "user",
          role: "viewer",
          canEdit: true,
          sourceFolderId: "f1",
        })
      }
    >
      remove-collaborator
    </button>
    <button
      onClick={() =>
        onUpdateCollaboratorRole(
          {
            id: "c1",
            name: "User1",
            type: "user",
            role: "viewer",
            canEdit: true,
            sourceFolderId: "f1",
          },
          "editor",
        )
      }
    >
      update-role
    </button>
  </div>
);

export default CollaborationPanel;
