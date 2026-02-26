import {
  getAdUserList,
  getBoxAccessToken,
  getBoxAccountId,
  getLoginUserInfo,
  getUserInfo,
  getUserList,
  removeUser,
  userActions,
  userCreation,
  userSliceReducer,
  updateUserInfo,
  userSelector,
  boxSelector,
} from './userSlice';
import { UsersApi, BoxApi } from '@/api';
import Config from '../../config/apiConfig';

const basePagination = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: 1,
  to: 1,
  total: 1,
  first_page_url: '',
  prev_page_url: null,
  next_page_url: null,
  last_page_url: '',
};

describe('userSlice', () => {
  it('setUserId でログイン状態とユーザーコードを更新する', () => {
    const nextState = userSliceReducer(undefined, userActions.setUserId('u123'));

    expect(nextState.isLogin).toBe(true);
    expect(nextState.loginUserCd).toBe('u123');
  });

  it('getLoginUserInfo.pending で loginUserCd と isLoading を更新する', () => {
    const action = getLoginUserInfo.pending('req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.loginUserCd).toBe('u001');
    expect(next.isLoading).toBe(true);
    expect(next.error.isError).toBe(false);
  });

  it('getLoginUserInfo.fulfilled で loginUserInfo を保存し isLogin を立てる', () => {
    const payload = { user: { user_cd: 'u001' } } as any;
    const action = getLoginUserInfo.fulfilled(payload, 'req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.loginUserInfo).toEqual(payload);
    expect(next.isLogin).toBe(true);
    expect(Config.apiOption.headers?.['x-jcl-user']).toBe('u001');
  });

  it('getLoginUserInfo.fulfilled で user_cd が無い場合は unknown user を設定する', () => {
    const payload = { user: {} } as any;
    const action = getLoginUserInfo.fulfilled(payload, 'req', 'u001');
    userSliceReducer(undefined, action);
    expect(Config.apiOption.headers?.['x-jcl-user']).toBe('unknown user');
  });

  it('getLoginUserInfo.fulfilled が null のときエラーにする', () => {
    const action = getLoginUserInfo.fulfilled(null as any, 'req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('getLoginUserInfo.rejected でエラーにする', () => {
    const action = getLoginUserInfo.rejected(new Error('x') as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('resetCondition で検索条件をリセットする', () => {
    const preloaded = userSliceReducer(undefined, {
      type: getUserList.pending.type,
      meta: { arg: { user_name: 'a' } },
    } as any);

    const nextState = userSliceReducer(preloaded, userActions.resetCondition());
    expect(nextState.list.searchCondition).toBeUndefined();
  });

  it('getUserList.pending で検索条件を保存し isLoading を立てる', () => {
    const autoComplete = [{ value: '1', label: 'センター1' }];
    const action = getUserList.pending('req1', {
      user_name: 'foo',
      auto_complete: autoComplete,
    } as any);
    const nextState = userSliceReducer(undefined, action);

    expect(nextState.isLoading).toBe(true);
    expect(nextState.list.searchCondition?.user_name).toBe('foo');
    expect(nextState.list.searchCondition?.auto_complete).toEqual(autoComplete);
    expect(nextState.list.searchCondition?.auto_complete).not.toBe(autoComplete);
  });

  it('getUserList.rejected でエラーをセットしローディングを下ろす', () => {
    const action = getUserList.rejected(
      new Error('fail') as any,
      'req1',
      { user_name: '' } as any,
    );
    const nextState = userSliceReducer(undefined, action);

    expect(nextState.isLoading).toBe(false);
    expect(nextState.error.isError).toBe(true);
    expect(nextState.error.messages).toBe('予期せぬエラーが発生しました。');
  });

  it('getAdUserList.fulfilled で一覧を保存し addSearched を立てる', () => {
    const items = [
      {
        mail_addr: 'user001@example.com',
        account_name: 'user001',
        disp_name: '利用者 001',
        organization_unit: '営業部',
        distinguished_name: 'cn=user001,dc=example,dc=com',
        status1: '1',
        status2: '1',
      },
    ];

    const action = getAdUserList.fulfilled(
      { items, pagination: basePagination },
      'request-1',
      { page: 1, per_page: 10 } as any,
    );

    const nextState = userSliceReducer(undefined, action);

    expect(nextState.adList.data?.items).toHaveLength(1);
    expect(nextState.adList.data?.pagination.total).toBe(1);
    expect(nextState.searchResultDisp.addSearched).toBe(true);
    expect(nextState.isLoading).toBe(false);
  });

  it('getAdUserList.fulfilled が null のときエラーにする', () => {
    const action = getAdUserList.fulfilled(null as any, 'req', {
      page: 1,
      per_page: 10,
    } as any);
    const nextState = userSliceReducer(undefined, action);
    expect(nextState.error.isError).toBe(true);
    expect(nextState.isLoading).toBe(false);
  });

  it('getAdUserList.rejected で addSearched が true になりエラーがセットされる', () => {
    const action = getAdUserList.rejected(
      new Error('fail') as any,
      'req',
      { page: 1, per_page: 10 } as any,
    );
    const nextState = userSliceReducer(undefined, action);
    expect(nextState.error.isError).toBe(true);
    expect(nextState.isLoading).toBe(false);
  });

  it('getAdUserList.rejected でも addSearched は変わらない', () => {
    const action = getAdUserList.rejected(
      new Error('fail') as any,
      'req',
      { page: 1, per_page: 10 } as any,
    );
    const nextState = userSliceReducer(undefined, action);
    expect(nextState.searchResultDisp.addSearched).toBe(false);
    expect(nextState.error.isError).toBe(true);
  });

  it('userCreation.fulfilled で該当ユーザーの status1 を更新する', () => {
    const params = {
      user_cd: 'foo',
      disp_name: 'Foo',
      account: 'foo',
      email: 'foo@example.com',
      language_code: 0,
    };
    const action = userCreation.fulfilled({ ok: true, user: params }, 'req', params);

    const nextState = userSliceReducer(undefined, action);
    expect(nextState.error.isError).toBe(false);
    expect(nextState.isLoading).toBe(false);
  });

  it('userCreation.fulfilled の null でエラーにする', () => {
    const params = {
      user_cd: 'foo',
      disp_name: 'Foo',
      account: 'foo',
      email: 'foo@example.com',
      language_code: 0,
    };
    const action = userCreation.fulfilled(null as any, 'req', params);
    const nextState = userSliceReducer(undefined, action);
    expect(nextState.error.isError).toBe(true);
    expect(nextState.isLoading).toBe(false);
  });

  it('getBoxAccessToken.fulfilled で token と tokenDt を更新する', () => {
    const action = getBoxAccessToken.fulfilled(
      { access_token: 'abc', expires_in: 3600 } as any,
      'req',
      'account-1',
    );
    const nextState = userSliceReducer(undefined, action);
    expect(nextState.box.token).toEqual({ access_token: 'abc', expires_in: 3600 });
    expect(nextState.box.tokenDt).not.toBe(-1);
  });

  it('getUserInfo.pending で userCd と isLoading を更新する', () => {
    const action = {
      ...getUserInfo.pending('req', 'u001'),
    };
    const next = userSliceReducer(undefined, action);
    expect(next.isLoading).toBe(true);
    expect(next.error.isError).toBe(false);
  });

  it('getUserInfo.fulfilled で userInfo を保存し isLogin を立てる', () => {
    const payload = { user: { user_cd: 'u001' } } as any;
    const action = getUserInfo.fulfilled(payload, 'req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.target).toEqual(payload);
    expect(next.isLogin).toBe(false);
  });

  it('getUserInfo.fulfilled の null でエラーにする', () => {
    const action = getUserInfo.fulfilled(null as any, 'req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('getUserInfo.rejected でエラーにする', () => {
    const action = getUserInfo.rejected(new Error('x') as any, 'req', 'u001');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('getUserList.fulfilled で一覧を保存する', () => {
    const payload = { items: [], pagination: basePagination } as any;
    const action = getUserList.fulfilled(payload, 'req', { user_name: '' } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.list.data).toEqual(payload);
    expect(next.isLoading).toBe(false);
  });

  it('getUserList.fulfilled が null のときエラーにする', () => {
    const action = getUserList.fulfilled(null as any, 'req', { user_name: '' } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('getAdUserList.pending で addSearched が false になる', () => {
    const action = getAdUserList.pending('req', { page: 1, per_page: 10 } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.searchResultDisp.addSearched).toBe(false);
    expect(next.adList.searchCondition).toEqual({ page: 1, per_page: 10 });
    expect(next.isLoading).toBe(true);
  });

  it('updateUserInfo.fulfilled で userInfo を更新する', () => {
    const action = updateUserInfo.fulfilled({ user: { user_cd: 'new' } } as any, 'req', {
      userCd: 'u',
      params: {},
    } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(false);
    expect(next.isLoading).toBe(false);
  });

  it('updateUserInfo.rejected でエラーにする', () => {
    const action = updateUserInfo.rejected(new Error('x') as any, 'req', {
      userCd: 'u',
      params: {},
    } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('updateUserInfo.fulfilled で payload null の場合はエラー', () => {
    const action = updateUserInfo.fulfilled(null as any, 'req', {
      userCd: 'u',
      params: {},
    } as any);
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('removeUser.fulfilled が false のときエラーにする', () => {
    const action = removeUser.fulfilled(false, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(false);
  });

  it('removeUser.fulfilled が null のときエラーにする', () => {
    const action = removeUser.fulfilled(null as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('removeUser.rejected でエラーにする', () => {
    const action = removeUser.rejected(new Error('x') as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('getBoxAccountId.fulfilled null でエラーにする', () => {
    const action = getBoxAccountId.fulfilled(null as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('getBoxAccountId.fulfilled で boxAccountId を更新する', () => {
    const action = getBoxAccountId.fulfilled('box-123', 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.box.boxAccountId).toBe('box-123');
  });

  it('getBoxAccountId.rejected でエラーにする', () => {
    const action = getBoxAccountId.rejected(new Error('x') as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('getBoxAccessToken.rejected でエラーにする', () => {
    const action = getBoxAccessToken.rejected(new Error('x') as any, 'req', 'u1');
    const next = userSliceReducer(undefined, action);
    expect(next.error.isError).toBe(true);
  });

  it('selectors を通じて値を取得できる', () => {
    const base = userSliceReducer(undefined, { type: '@@INIT' });
    const populated = {
      ...base,
      isLoading: true,
      isLogin: true,
      loginUserCd: 'u1',
      loginUserInfo: { user: { user_cd: 'u1' } } as any,
      list: {
        searchCondition: { user_name: 'name' } as any,
        data: { items: [], pagination: basePagination } as any,
      },
      adList: {
        searchCondition: { disp_name: 'ad' } as any,
        data: { items: [], pagination: basePagination } as any,
      },
      target: { user: { user_cd: 't1' } } as any,
      searchResultDisp: { settingSearched: true, addSearched: true },
      box: { boxAccountId: 'box-1', token: { t: 1 } as any, tokenDt: 123 },
    };
    const root = { user: populated } as any;

    expect(userSelector.loginUserSelector()(root)).toEqual(populated.loginUserInfo);
    expect(userSelector.loginUserCdSelector()(root)).toBe('u1');
    expect(userSelector.isLoadingSelector()(root)).toBe(true);
    expect(userSelector.isLoginSelector()(root)).toBe(true);
    expect(userSelector.userSearchConditionSelector()(root)).toEqual(
      populated.list.searchCondition,
    );
    expect(userSelector.userListSelector()(root)).toEqual(populated.list.data);
    expect(userSelector.adUserListSelector()(root)).toEqual(populated.adList.data);
    expect(userSelector.adUserSearchConditionSelector()(root)).toEqual(
      populated.adList.searchCondition,
    );
    expect(userSelector.userTargetSelector()(root)).toEqual(populated.adList.data);
    expect(userSelector.searchResultDispSelector()(root)).toEqual(
      populated.searchResultDisp,
    );
    expect(boxSelector.accountIdSelector()(root)).toBe('box-1');
    expect(boxSelector.tokenSelector()(root)).toEqual({ t: 1 });
    expect(boxSelector.tokenDtSelector()(root)).toBe(123);
  });

  it('thunk getUserInfo が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'getUser')
      .mockResolvedValue({ data: { user: { user_cd: 'u1' } } } as any);

    await getUserInfo('u1')(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getUserInfo.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getUserInfo.fulfilled.type }),
    );

    (UsersApi.prototype.getUser as jest.Mock).mockRestore();
  });

  it('thunk getLoginUserInfo が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'getUser')
      .mockResolvedValue({ data: { user: { user_cd: 'u1' } } } as any);

    await getLoginUserInfo('u1')(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getLoginUserInfo.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getLoginUserInfo.fulfilled.type }),
    );

    (UsersApi.prototype.getUser as jest.Mock).mockRestore();
  });

  it('thunk getUserList が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'getUserList')
      .mockResolvedValue({ data: { items: [], pagination: basePagination } } as any);

    await getUserList({ user_name: 'a' } as any)(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getUserList.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getUserList.fulfilled.type }),
    );

    (UsersApi.prototype.getUserList as jest.Mock).mockRestore();
  });

  it('thunk getAdUserList がモックデータで fulfilled する', async () => {
    const dispatch = jest.fn();
    await getAdUserList({
      page: 1,
      per_page: 5,
      disp_name: '利用者',
      account_name: 'user',
      mail_addr: 'user',
      status: '1',
    } as any)(
      dispatch,
      () => ({} as any),
      undefined,
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getAdUserList.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getAdUserList.fulfilled.type }),
    );
  });

  it('userCreation.pending でローディングとエラーリセット', () => {
    const next = userSliceReducer(undefined, userCreation.pending('req', {} as any));
    expect(next.isLoading).toBe(true);
    expect(next.error.isError).toBe(false);
  });

  it('userCreation.rejected でエラーをセット', () => {
    const next = userSliceReducer(undefined, userCreation.rejected(new Error('x') as any, 'r', {} as any));
    expect(next.error.isError).toBe(true);
    expect(next.isLoading).toBe(false);
  });

  it('thunk updateUserInfo が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'updateUser')
      .mockResolvedValue({ data: { user: { user_cd: 'u2' } } } as any);

    await updateUserInfo({ userCd: 'u2', params: {} } as any)(
      dispatch,
      () => ({} as any),
      undefined,
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: updateUserInfo.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: updateUserInfo.fulfilled.type }),
    );
    (UsersApi.prototype.updateUser as jest.Mock).mockRestore();
  });

  it('thunk userCreation が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'createUser')
      .mockResolvedValue({ data: { ok: true } } as any);

    const params = {
      user_cd: 'u2',
      disp_name: 'User 2',
      account: 'u2',
      email: 'u2@example.com',
      language_code: 0,
    };

    await userCreation(params as any)(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: userCreation.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: userCreation.fulfilled.type }),
    );

    (UsersApi.prototype.createUser as jest.Mock).mockRestore();
  });

  it('updateUserInfo.pending でローディング開始', () => {
    const next = userSliceReducer(undefined, updateUserInfo.pending('r', {} as any));
    expect(next.isLoading).toBe(true);
  });

  it('thunk removeUser が API を呼び出し fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(UsersApi.prototype, 'removeUser')
      .mockResolvedValue({ data: true } as any);

    await removeUser('u3')(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: removeUser.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: removeUser.fulfilled.type }),
    );
    (UsersApi.prototype.removeUser as jest.Mock).mockRestore();
  });

  it('removeUser.pending でローディング開始', () => {
    const next = userSliceReducer(undefined, removeUser.pending('r', 'u'));
    expect(next.isLoading).toBe(true);
  });

  it('thunk getBoxAccountId が fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(BoxApi.prototype, 'getBoxAccountId')
      .mockResolvedValue({ data: 'box-9' } as any);

    await getBoxAccountId('u9')(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getBoxAccountId.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getBoxAccountId.fulfilled.type }),
    );
    (BoxApi.prototype.getBoxAccountId as jest.Mock).mockRestore();
  });

  it('getBoxAccountId.pending でローディング開始', () => {
    const next = userSliceReducer(undefined, getBoxAccountId.pending('r', 'u'));
    expect(next.isLoading).toBe(true);
  });

  it('thunk getBoxAccessToken が fulfilled を dispatch する', async () => {
    const dispatch = jest.fn();
    jest
      .spyOn(BoxApi.prototype, 'getContentsPickerToken')
      .mockResolvedValue({ data: { access_token: 'xyz' } } as any);

    await getBoxAccessToken('acc')(dispatch, () => ({} as any), undefined);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getBoxAccessToken.pending.type }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: getBoxAccessToken.fulfilled.type }),
    );

    (BoxApi.prototype.getContentsPickerToken as jest.Mock).mockRestore();
  });

  it('getBoxAccessToken.pending でローディング開始', () => {
    const next = userSliceReducer(undefined, getBoxAccessToken.pending('r', 'u'));
    expect(next.isLoading).toBe(true);
  });

  it('getBoxAccessToken.fulfilled null でエラー', () => {
    const next = userSliceReducer(
      undefined,
      getBoxAccessToken.fulfilled(null as any, 'r', 'u'),
    );
    expect(next.error.isError).toBe(true);
  });
});
