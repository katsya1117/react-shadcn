import chroma from "chroma-js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select, { type MultiValue, type StylesConfig } from "react-select";

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
export const AutoCompleteMulti = (props: {
  value: MultiValue<AutoCompleteData>;
  type: "user" | "center" | "userGroup";
  placeholder?: string;
  onChange: (newValue: MultiValue<AutoCompleteData>) => void;
}) => {
  const dispatch: AppDispatch = useDispatch();

  const users = useSelector(autoCompleteSelector.usersSelector());
  const groups = useSelector(autoCompleteSelector.groupsSelector());
  const userGroup = useSelector(autoCompleteSelector.userGroupSelector());

  useEffect(() => {
    if (users.length === 0 && groups.length === 0 && userGroup.length === 0) {
      dispatch(getAutoComplete());
    }
    return () => {
      // クリーンアップ
    };
  }, []);

  const autoCompleteStyles: StylesConfig<AutoCompleteData, true> = {
    container: (styles) => ({
      ...styles,
      flexGrow: 1,
    }),
    multiValue: (styles, { data }) => {
      const color = chroma((data as any).color);
      return {
        ...styles,
        backgroundColor: color.alpha(0.1).css(),
      };
    },
  };

  const options =
    props.type === "user"
      ? users
      : props.type === "center"
      ? groups
      : userGroup;

  return (
    <Select<AutoCompleteData, true>
      isMulti={true}
      options={options}
      styles={autoCompleteStyles}
      placeholder={props.placeholder ?? ""}
      onChange={props.onChange}
      value={props.value}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={{
        ...autoCompleteStyles,
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};
