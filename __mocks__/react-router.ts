const actual = jest.requireActual("react-router");
const mockNavigate = jest.fn();

(globalThis as any).mockNavigate = mockNavigate;

module.exports = {
  ...actual,
  useNavigate: () => mockNavigate,
};
