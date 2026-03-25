import { BoxApi } from './src/api/index.ts';

const api = new BoxApi();
const before = await api.getFolderCollaborations('0');
await api.createCollaborations({
  folderId: '0',
  collaboratorId: 'demo-user',
  collaboratorName: 'デモユーザー',
  collaboratorType: 'user',
  role: 'viewer',
});
const afterCreate = await api.getFolderCollaborations('0');
await api.updateCollaboration('0:demo-user', { role: 'editor' });
const afterUpdate = await api.getFolderCollaborations('0');
await api.deleteCollaborations('0:demo-user');
const afterDelete = await api.getFolderCollaborations('0');
console.log(JSON.stringify({
  before: before.data.length,
  afterCreate: afterCreate.data.find((row) => row.id === '0:demo-user'),
  afterUpdate: afterUpdate.data.find((row) => row.id === '0:demo-user'),
  afterDelete: afterDelete.data.find((row) => row.id === '0:demo-user') ?? null,
}, null, 2));
