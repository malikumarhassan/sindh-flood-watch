import next from 'eslint-config-next/core-web-vitals';
export default [...next, {ignores:['**/.next/**','**/dist/**','**/expo-env.d.ts','**/next-env.d.ts','.venv/**']}, {rules:{'@next/next/no-html-link-for-pages':'off','react-hooks/set-state-in-effect':'off','react-hooks/exhaustive-deps':'off'}}];
