import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  boxSelector,
  getBoxAccessToken,
  getBoxAccountId,
  userSelector,
} from "@/redux/slices/userSlice";

export type BoxManageState = {
  token?: string;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
};

type BoxManageProps = {
  children: (state: BoxManageState) => ReactNode;
};

const BoxManage = ({ children }: BoxManageProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const loginUserCd = useSelector(userSelector.loginUserCdSelector());
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const effectiveUserCd = useMemo(
    () => (loginUserCd && loginUserCd.trim() ? loginUserCd : "demo-user"),
    [loginUserCd],
  );

  const ensureToken = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const accountId = await dispatch(
        getBoxAccountId(effectiveUserCd),
      ).unwrap();
      await dispatch(getBoxAccessToken(accountId)).unwrap();
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, effectiveUserCd, isLoading]);

  useEffect(() => {
    if (!token) {
      ensureToken().catch(() => {
        /* handled by state */
      });
    }
  }, [ensureToken, token]);

  return children({
    token,
    isLoading,
    error,
    refresh: ensureToken,
  });
};

export default BoxManage;
export { BoxManage };
