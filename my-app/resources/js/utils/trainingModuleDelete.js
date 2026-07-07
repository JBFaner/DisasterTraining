import Swal from 'sweetalert2';
import { trainingModuleDestroy, trainingModuleShow } from './trainingModuleRoutes';

const DELETE_BLOCKED_MESSAGE =
    'This training module cannot be deleted because participant learning records already exist.';

const DELETE_CONFIRM_HTML = `
<p class="text-left text-sm text-slate-600 mb-3">You are about to permanently delete this training module.</p>
<p class="text-left text-sm text-slate-600 mb-2">The following data may also be removed:</p>
<ul class="text-left text-sm text-slate-600 list-disc pl-5 space-y-1 mb-3">
  <li>All Lessons</li>
  <li>Learning Resources</li>
  <li>AI Lesson Question Banks</li>
  <li>Final AI Scenario Assessment configurations</li>
  <li>Participant lesson progress</li>
  <li>Quiz attempts</li>
  <li>Evaluation records related to this module</li>
</ul>
<p class="text-left text-sm font-medium text-slate-700">This action cannot be undone.</p>
`;

export function trainingModuleManageUrl(moduleId) {
    return trainingModuleShow('LGU_ADMIN', moduleId);
}

export async function handleTrainingModuleDelete(module, csrf) {
    if (module?.has_participant_records) {
        await Swal.fire({
            icon: 'error',
            title: 'Cannot Delete',
            text: DELETE_BLOCKED_MESSAGE,
            confirmButtonText: 'Close',
        });
        return false;
    }

    const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Delete Training Module?',
        html: DELETE_CONFIRM_HTML,
        showCancelButton: true,
        confirmButtonText: 'Delete Module',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        focusCancel: true,
    });

    if (!confirm.isConfirmed) {
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('_token', csrf);
        formData.append('_method', 'DELETE');

        const response = await fetch(trainingModuleDestroy(module.id), {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (response.status === 422) {
            const data = await response.json().catch(() => ({}));
            await Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: data.message || DELETE_BLOCKED_MESSAGE,
                confirmButtonText: 'Close',
            });
            return false;
        }

        if (!response.ok) {
            throw new Error('Request failed');
        }

        window.location.href = '/admin/training-modules';
        return true;
    } catch {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete module. Please try again.',
        });
        return false;
    }
}
