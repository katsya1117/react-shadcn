import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  boxSelector,
  getBoxAccessToken,
  getBoxAccountId,
  userSelector,
} from "../../../redux/slices/userSlice";
import type { AppDispatch } from "../../../redux/store";

const MONITOR_MIN = 5;
export const BoxManager = () => {
  const dispatch: AppDispatch = useDispatch();
  const isLogin = useSelector(userSelector.isLoginSelector());
  const userCd = useSelector(userSelector.loginUserCdSelector());
  const accountId = useSelector(boxSelector.accountIdSelector());
  const token = useSelector(boxSelector.tokenSelector());
  const tokenDt = useSelector(boxSelector.tokenDtSelector());
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    if (!accountId && userCd) {
      dispatch(getBoxAccountId(userCd));
      return;
    }
    if (accountId && !token) {
      dispatch(getBoxAccessToken(accountId));
      return;
    }
    return () => {
      // クリーンアップ
    };
  }, [isLogin, accountId, token, userCd]);
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if ((Date.now() - tokenDt) / 1000 > 2940) {
          dispatch(getBoxAccessToken(accountId));
        }
        setCounter(counter + 1);
      },
      MONITOR_MIN * 60 * 1000,
    );
    return () => {
      // クリーンアップ
      clearTimeout(timer);
    };
  }, [counter, accountId, tokenDt]);

  return <></>;
};
