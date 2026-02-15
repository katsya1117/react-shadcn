import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import type {
  ActionMeta,
  GroupBase,
  SingleValue,
  StylesConfig,
} from "react-select";

import type { AutoCompleteData } from "../../../api";
import {
  autoCompleteSelector,
  getAutoComplete,
} from "../../../redux/slices/autoCompleteSlice";
import type { AppDispatch } from "../../../redux/store";

/**
 * ユーザー名、センター名によるオートコンプリートコンポーネント
 * @param props
 * @returns
 */
export const AutoCompleteSingle = (props: {
  value: SingleValue<AutoCompleteData> | undefined;
  type: "user" | "center" | "userGroup";
  placeholder?: string;
  onChange: (
    newValue: SingleValue<AutoCompleteData>,
    actionMeta: ActionMeta<AutoCompleteData>
  ) => void;
}) => {
  const dispatch: AppDispatch = useDispatch();

  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const userGroup = useSelector(autoCompleteSelector.userGroupSelector());

  useEffect(() => {
    if (
      users.length === 0 &&
      groups.length === 0 &&
      userGroup.length === 0
    ) {
      dispatch(getAutoComplete());
    }

    return () => {
      // クリーンアップ
    };
  }, []);

  const autoCompleteStyles: StylesConfig<
    AutoCompleteData,
    false,
    GroupBase<AutoCompleteData>
  > = {
    container: (styles) => ({
      ...styles,
      flexGrow: 1,
    }),
  };

  const options =
    props.type === "user"
      ? users
      : props.type === "center"
      ? groups
      : userGroup;

  return (
    <Select<AutoCompleteData, false>
      options={options}
      placeholder={props.placeholder ?? ""}
      styles={autoCompleteStyles}
      value={props.value}
      onChange={props.onChange}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={{
        ...autoCompleteStyles,
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};
