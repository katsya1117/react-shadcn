import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import type { SingleValue } from "react-select";

import type {
  AutoCompleteData,
  CreateCollaborationsParams,
  GetFolderCollaborationsResponse,
} from "@/api";
import { toast } from "@/components/ui/sonner";
import { DEFAULT_ROLE } from "@/constants/ssConstants";
import { useAppDispatch } from "@/redux/hooks";
import { autoCompleteSelector } from "@/redux/slices/autoCompleteSlice";
import {
  createCollaborations,
  deleteCollaborations,
  getFolderCollaborations,
  updateCollaborations,
} from "@/redux/slices/ssSlice";
import type { Collaborator, RoleType } from "@/types/ss";
import {
  findDuplicateCollaboration,
  resolveCollaboratorType,
} from "@/pages/ssHelpers";

type UseCollaboratorActionsOptions = {
  /** 操作の対象フォルダ ID（いま開いているフォルダ） */
  currentFolderId: string;
  /** 変更後に呼ぶ、一覧の更新処理。失敗したら reject する。 */
  refresh: () => Promise<void>;
};

/** 変更 1 件の流れ（API → 一覧の更新 → 通知）を表す設定。 */
type MutationSpec = {
  /** mutation thunk の実行（API 1 回だけ）。失敗したら reject する。 */
  execute: () => Promise<unknown>;
  /** execute が失敗したときの通知文 */
  errorMessage: (error: unknown) => string;
  successMessage: string;
  /** API は成功したが、一覧の更新に失敗したときの通知文 */
  refreshErrorMessage: string;
  /** 一覧の更新まで成功したときに実行する後処理 */
  onSuccess?: () => void;
};

/** rejectWithValue の文字列はそのまま使い、それ以外は固定文にする。 */
const stringOr = (fallback: string) => (error: unknown) =>
  typeof error === "string" ? error : fallback;

/**
 * コラボレーターの追加・削除・ロール更新と、追加フォームの状態を扱うフック。
 *
 * 3 つの操作は、どれも「API を 1 回呼ぶ → 一覧を更新する → 通知する」という同じ流れ（runMutation）。
 * 一覧の更新方法は呼び出し側が決める（refresh）。このフックは、一覧の取得・表示には関与しない。
 */
export const useCollaboratorActions = ({
  currentFolderId,
  refresh,
}: UseCollaboratorActionsOptions) => {
  const dispatch = useAppDispatch();
  const groups = useSelector(autoCompleteSelector.groupsSelector());

  // ----- 追加フォームの状態 -----
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<SingleValue<AutoCompleteData>>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>(DEFAULT_ROLE);

  const resetForm = useCallback(() => {
    setSelectedCollaborator(null);
    setSelectedRole(DEFAULT_ROLE);
  }, []);

  // フォルダが変わったら入力中のフォームをリセット。
  // effect ではなく、描画中に「前回のフォルダ ID」と比べて直す（React 公式の、props 変更で state を直す書き方）。
  // effect だと、古い入力が 1 回描画されてから消える。
  const [formFolderId, setFormFolderId] = useState(currentFolderId);
  if (formFolderId !== currentFolderId) {
    setFormFolderId(currentFolderId);
    resetForm();
  }

  // ----- 実行中の管理 -----
  // 実行中の操作の数で持つ（重なっても、最後の 1 件が終わるまで true のまま）。
  const [pendingCount, setPendingCount] = useState(0);
  const isMutating = pendingCount > 0;

  const withPending = useCallback(async (task: () => Promise<void>) => {
    setPendingCount((count) => count + 1);
    try {
      await task();
    } finally {
      setPendingCount((count) => count - 1);
    }
  }, []);

  // ----- 共通の流れ -----
  const runMutation = useCallback(
    async (spec: MutationSpec) => {
      try {
        await spec.execute();
      } catch (error) {
        toast.error(spec.errorMessage(error));
        return;
      }

      try {
        // 成功後に一覧を再取得して、親子関係を含む最終状態を Box のレスポンスで揃える。
        await refresh();
        toast.success(spec.successMessage);
        spec.onSuccess?.();
      } catch {
        toast.error(spec.refreshErrorMessage);
      }
    },
    [refresh],
  );

  // ----- 操作 -----
  const add = useCallback(async () => {
    if (!selectedCollaborator) return;

    const { collaboratorType, accessibleByType } = resolveCollaboratorType(
      groups,
      selectedCollaborator.value,
    );

    await withPending(async () => {
      // 重複チェックには最新の一覧が必要。キャッシュ（TTL 内）は他の人の変更で古い可能性があるため使わず、
      // 追加のたびに必ず取得する（追加は人手の操作で回数が少なく、取得 1 回のコストは小さい）。
      let existingRows: GetFolderCollaborationsResponse[];
      try {
        existingRows = (
          await dispatch(getFolderCollaborations(currentFolderId)).unwrap()
        ).data;
      } catch {
        toast.error("コラボレーター一覧の取得に失敗しました");
        return;
      }

      if (
        findDuplicateCollaboration(
          existingRows,
          selectedCollaborator.value,
          accessibleByType,
        )
      ) {
        toast.error("同じコラボレーターは既に設定されています");
        return;
      }

      const params: CreateCollaborationsParams = {
        folderId: currentFolderId,
        collaboratorId: selectedCollaborator.value,
        collaboratorType,
        collaboratorName: selectedCollaborator.label,
        role: selectedRole,
        can_view_path: true,
      };

      await runMutation({
        execute: () => dispatch(createCollaborations(params)).unwrap(),
        errorMessage: stringOr("コラボレーターの追加に失敗しました"),
        successMessage: `${selectedCollaborator.label} を追加しました`,
        refreshErrorMessage: "追加は完了しましたが一覧の更新に失敗しました",
        onSuccess: resetForm,
      });
    });
  }, [
    currentFolderId,
    dispatch,
    groups,
    resetForm,
    runMutation,
    selectedCollaborator,
    selectedRole,
    withPending,
  ]);

  const remove = useCallback(
    (collaborator: Collaborator) =>
      withPending(() =>
        runMutation({
          // collaborator.id は collaboration レコードの ID（user/group ID ではない）。
          execute: () =>
            dispatch(
              deleteCollaborations({ collaborationId: collaborator.id }),
            ).unwrap(),
          errorMessage: () => "コラボレーターの削除に失敗しました",
          successMessage: `${collaborator.name} を削除しました`,
          refreshErrorMessage: "削除は完了しましたが一覧の更新に失敗しました",
        }),
      ),
    [dispatch, runMutation, withPending],
  );

  const updateRole = useCallback(
    (collaborator: Collaborator, role: RoleType) =>
      withPending(() =>
        runMutation({
          execute: () =>
            dispatch(
              updateCollaborations({
                collaborationId: collaborator.id,
                params: { role },
              }),
            ).unwrap(),
          errorMessage: stringOr("コラボレーターのロール更新に失敗しました"),
          successMessage: `${collaborator.name} のロールを更新しました`,
          refreshErrorMessage: "更新は完了しましたが一覧の更新に失敗しました",
        }),
      ),
    [dispatch, runMutation, withPending],
  );

  return {
    selectedCollaborator,
    selectedRole,
    setSelectedCollaborator,
    setSelectedRole,
    isMutating,
    add,
    remove,
    updateRole,
  };
};
