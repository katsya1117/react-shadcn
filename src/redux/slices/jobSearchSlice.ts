import type { AnyAction } from 'redux';
import {
  type AccessLevel,
  type JobStatus,
  type MockFolder,
  type MockJob,
  mockFolders,
  mockJobs,
} from '@/api/mock/jobsDb';

export type { JobStatus, AccessLevel };
export type Job = MockJob;
export type Folder = MockFolder;

const headers = [
  { key: 'id', name: 'Job', align: 'left' as const },
  { key: 'status', name: '状態', align: 'left' as const },
  { key: 'owner', name: '担当', align: 'left' as const },
  { key: 'folder', name: 'フォルダ', align: 'left' as const },
  { key: 'updatedAt', name: '更新', align: 'left' as const },
  { key: 'nextRun', name: '次回', align: 'left' as const },
  { key: 'priority', name: '優先度', align: 'right' as const },
];

const listResponse = {
  headers,
  data: mockJobs,
  items: mockJobs.map((job) => ({
    items: headers.map((h) => ({
      key: h.key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (job as any)[h.key] ?? '',
    })),
  })),
  pagination: {
    total: mockJobs.length,
    page: 1,
    per_page: mockJobs.length,
  },
};

const filteredList = mockJobs.map((job) => ({
  job,
  folder: mockFolders.find((f) => f.path === job.folder),
}));

export const updateFolderAccess = (payload: { path: string; access: AccessLevel }) => ({
  type: 'jobs/updateFolderAccess',
  payload,
});

export const jobSelector = {
  jobListSelector: () => () => listResponse,
  folderSelector: () => () => mockFolders,
  filteredSelector: () => () => filteredList,
  updateFolderAccess,
};

export const getJobList = (params: unknown) => ({
  type: 'jobs/mockSearch',
  payload: params,
} as AnyAction);

export const jobsReducer = (
  state = { jobs: mockJobs, folders: mockFolders },
  action: AnyAction,
) => {
  switch (action.type) {
    case 'jobs/updateFolderAccess': {
      return {
        ...state,
        folders: state.folders.map((f: MockFolder) =>
          f.path === action.payload.path ? { ...f, access: action.payload.access } : f,
        ),
      };
    }
    default:
      return state;
  }
};
