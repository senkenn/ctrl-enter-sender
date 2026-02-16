export default defineUnlistedScript({
    main() {
        document.addEventListener('__ces_insert_newline', () => {
            const el = document.querySelector('[role="textbox"][data-slate-editor]');
            if (!el) return;
            const fk = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
            if (!fk) return;
            let f = (el as any)[fk];
            for (let i = 0; i < 30 && f; i++) {
                if (f.memoizedProps?.editor?.insertSoftBreak) {
                    f.memoizedProps.editor.insertSoftBreak();
                    return;
                }
                f = f.return;
            }
        });
    },
});
