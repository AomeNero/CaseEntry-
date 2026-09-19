// vitest 专用 stub：server-only 包的默认入口在非 react-server 环境下会抛错，
// 测试环境用空模块替代；Next dev/build 的守卫行为不受影响。
const stub = {};
export default stub;
