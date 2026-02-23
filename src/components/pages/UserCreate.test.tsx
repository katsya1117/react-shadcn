import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserCreate } from "./UserCreate";
import { getAdUserList, userCreation } from "@/redux/slices/userSlice";
import { renderWithRedux, createMockPagination } from "../../../test/test-utils";
import { toast } from "@/components/ui/sonner";

jest.mock('@/components/ui/confirm-button', () => ({
  __esModule: true,
  default: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
  ConfirmButton: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
}));

// コンポーネント内の相対パスで参照される ConfirmButton もモックする
jest.mock('../ui/confirm-button', () => ({
  __esModule: true,
  default: ({ onClick, buttonLabel }: any) => (
    <button onClick={onClick}>{buttonLabel}</button>
  ),
}));

jest.mock('@/components/parts/Pagination/Pagination', () => ({
  __esModule: true,
  CustomPagination: ({ onHandle }: any) => (
    <button onClick={() => onHandle({ page: 2 })}>paginate</button>
  ),
}));

function passthrough(tag: keyof JSX.IntrinsicElements = 'div') {
  return ({ children, ...rest }: any) => React.createElement(tag, rest, children);
}

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: passthrough('button'),
}));
jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  Card: passthrough(),
  CardContent: passthrough(),
  CardHeader: passthrough(),
  CardFooter: passthrough(),
}));
jest.mock('@/components/ui/field', () => ({
  __esModule: true,
  Field: passthrough(),
  FieldGroup: passthrough(),
  FieldLabel: ({ children, ...rest }: any) => (
    <label {...rest}>{children}</label>
  ),
  FieldSet: passthrough(),
}));
jest.mock('@/components/ui/input-group', () => ({
  __esModule: true,
  InputGroup: passthrough(),
  InputGroupAddon: passthrough(),
  InputGroupInput: ({ ...rest }: any) => <input {...rest} />,
  InputGroupText: passthrough(),
}));
jest.mock('@/components/ui/label', () => ({
  __esModule: true,
  Label: ({ children, ...rest }: any) => <label {...rest}>{children}</label>,
}));
jest.mock('@/components/ui/radio-group', () => ({
  __esModule: true,
  RadioGroup: ({ children }: any) => <div>{children}</div>,
  RadioGroupItem: ({ ...rest }: any) => <input type="radio" {...rest} />,
}));
jest.mock('@/components/ui/table', () => ({
  __esModule: true,
  Table: passthrough('table'),
  TableBody: passthrough('tbody'),
  TableCell: passthrough('td'),
  TableHead: passthrough('th'),
  TableHeader: passthrough('thead'),
  TableRow: passthrough('tr'),
}));

jest.mock('@/redux/slices/userSlice', () => {
  const actual = jest.requireActual('@/redux/slices/userSlice');
  const userCreationMock = jest.fn((arg) => ({ type: 'userCreation', meta: { arg } }));
  (userCreationMock as any).fulfilled = {
    match: (action: any) => action.type === 'userCreation',
  };
  return {
    ...actual,
    getAdUserList: jest.fn((arg) => ({ type: 'getAdUserList', payload: arg })),
    userCreation: userCreationMock,
  };
});

jest.mock('@/components/ui/sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検索ボタンで getAdUserList を dispatch する', async () => {
    const { dispatchSpy } = renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: { searchCondition: undefined, data: undefined, addSearched: false },
      },
    });

    await userEvent.type(screen.getByLabelText('表示名'), 'foo');
    await userEvent.type(screen.getByLabelText('アカウント名'), 'bar');
    await userEvent.type(screen.getByLabelText('メールアドレス'), 'baz');

    fireEvent.click(screen.getAllByText('検索')[0]);

    expect(getAdUserList).toHaveBeenCalledWith(
      expect.objectContaining({ mail_addr: 'baz', order: 'asc', sort: 'disp_name' }),
    );
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('検索結果なしの時にメッセージを表示する', () => {
    renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: { searchCondition: {}, data: undefined, addSearched: true },
      },
    });
    expect(screen.getByText('条件に合うユーザーが見つかりませんでした')).toBeInTheDocument();
  });

  it('登録済みの場合は「登録済み」を表示する', () => {
    renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: {
          searchCondition: {},
          addSearched: true,
          data: {
            items: [
              {
                mail_addr: 'user@example.com',
                account_name: 'user',
                disp_name: 'User',
                organization_unit: '部',
                distinguished_name: 'dn',
                status1: '1',
                status2: '1',
              },
            ],
            pagination: createMockPagination(),
          },
        },
      },
    });
    expect(screen.getByText('登録済み')).toBeInTheDocument();
  });

  it('登録ボタンで userCreation が dispatch される', () => {
    renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: {
          searchCondition: {},
          addSearched: true,
          data: {
            items: [
              {
                mail_addr: 'new@example.com',
                account_name: 'new',
                disp_name: 'New User',
                organization_unit: '部',
                distinguished_name: 'dn',
                status1: '0',
                status2: '0',
              },
            ],
            pagination: createMockPagination(),
          },
        },
      },
    });
    fireEvent.click(screen.getByText('登録'));

    expect(userCreation).toHaveBeenCalledWith(
      expect.objectContaining({ user_cd: 'new', email: 'new@example.com' }),
    );
  });

  it('クリアボタンで入力をリセットする', async () => {
    renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: {
          searchCondition: { disp_name: 'x' } as any,
          data: undefined,
          addSearched: false,
        },
      },
    });

    const display = screen.getByLabelText('表示名') as HTMLInputElement;
    const account = screen.getByLabelText('アカウント名') as HTMLInputElement;
    const mail = screen.getByLabelText('メールアドレス') as HTMLInputElement;

    await userEvent.type(display, 'foo');
    await userEvent.type(account, 'bar');
    await userEvent.type(mail, 'baz');

    fireEvent.click(screen.getByText('クリア'));

    expect(display.value).toBe('');
    expect(account.value).toBe('');
    expect(mail.value).toBe('');
  });

  it('入力値超過時は toast.error を出して dispatch しない', () => {
    const long = 'x'.repeat(120);
    renderWithRedux(<UserCreate />, {
      preloadedUserState: {
        ad: {
          searchCondition: {},
          addSearched: true,
          data: {
            items: [
              {
                mail_addr: `${long}@example.com`,
                account_name: long,
                disp_name: long,
                organization_unit: '部',
                distinguished_name: 'dn',
                status1: '0',
                status2: '0',
              },
            ],
            pagination: createMockPagination(),
          },
        },
      },
    });

    fireEvent.click(screen.getByText('登録'));
    expect(toast.error).toHaveBeenCalled();
    expect(userCreation).not.toHaveBeenCalled();
  });
});
