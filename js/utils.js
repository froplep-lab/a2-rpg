export function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement('div');
    const borderColor = type === 'success' ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-300' : 
                        type === 'error' ? 'border-pink-500/50 bg-pink-950/80 text-pink-300' : 
                        'border-cyan-500/50 bg-slate-900/90 text-cyan-300';

    toast.className = `cyber-toast glass-panel px-4 py-3 rounded-2xl border ${borderColor} text-xs font-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center gap-2.5 pointer-events-auto`;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon} text-sm"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function toggleModal(modalId, boxId, show) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    if (!modal || !box) return;
    
    if (show) {
        document.body.style.overflow = 'hidden';
        modal.classList.remove("pointer-events-none", "opacity-0");
        modal.classList.add("opacity-100");
        box.classList.remove("scale-90", "opacity-0", "translate-y-4");
        box.classList.add("scale-100", "opacity-100", "translate-y-0");
    } else {
        box.classList.remove("scale-100", "opacity-100", "translate-y-0");
        box.classList.add("scale-90", "opacity-0", "translate-y-4");
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0", "pointer-events-none");
        if (document.querySelectorAll('.fixed.inset-0:not(.pointer-events-none)').length <= 0) {
            document.body.style.overflow = '';
        }
    }
}