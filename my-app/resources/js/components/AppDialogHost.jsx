import React from 'react';
import { LessonConfirmDialog } from './LessonFormFields';
import {
    registerAppAlert,
    registerAppChoice,
    registerAppConfirm,
} from '../utils/appAlert';

export function AppDialogHost() {
    const [appAlert, setAppAlert] = React.useState(null);
    const [appConfirm, setAppConfirm] = React.useState(null);
    const [appChoice, setAppChoice] = React.useState(null);

    React.useEffect(() => {
        registerAppAlert(({ title, description, icon }) => new Promise((resolve) => {
            setAppAlert({
                title,
                description,
                icon,
                onClose: () => {
                    setAppAlert(null);
                    resolve();
                },
            });
        }));

        registerAppConfirm(({
            title,
            description,
            confirmLabel,
            cancelLabel,
            confirmVariant,
        }) => new Promise((resolve) => {
            setAppConfirm({
                title,
                description,
                confirmLabel,
                cancelLabel,
                confirmVariant,
                onConfirm: () => {
                    setAppConfirm(null);
                    resolve(true);
                },
                onCancel: () => {
                    setAppConfirm(null);
                    resolve(false);
                },
            });
        }));

        registerAppChoice(({
            title,
            description,
            icon,
            buttons,
        }) => new Promise((resolve) => {
            setAppChoice({
                title,
                description,
                icon,
                buttons: buttons.map((button) => ({
                    ...button,
                    onClick: () => {
                        setAppChoice(null);
                        resolve(button.value ?? button.label);
                    },
                })),
                onCancel: () => {
                    setAppChoice(null);
                    resolve(null);
                },
            });
        }));

        return () => {
            registerAppAlert(null);
            registerAppConfirm(null);
            registerAppChoice(null);
        };
    }, []);

    return (
        <>
            <LessonConfirmDialog
                open={Boolean(appAlert)}
                title={appAlert?.title || ''}
                description={appAlert?.description || ''}
                icon={appAlert?.icon || 'warning'}
                buttons={[
                    { label: 'OK', variant: 'primary', onClick: () => appAlert?.onClose?.() },
                ]}
                onOpenChange={(open) => {
                    if (!open) {
                        appAlert?.onClose?.();
                    }
                }}
            />

            <LessonConfirmDialog
                open={Boolean(appConfirm)}
                title={appConfirm?.title || ''}
                description={appConfirm?.description || ''}
                icon="question"
                buttons={[
                    {
                        label: appConfirm?.confirmLabel || 'Confirm',
                        variant: appConfirm?.confirmVariant || 'danger',
                        onClick: () => appConfirm?.onConfirm?.(),
                    },
                    {
                        label: appConfirm?.cancelLabel || 'Cancel',
                        variant: 'secondary',
                        onClick: () => appConfirm?.onCancel?.(),
                    },
                ]}
                onOpenChange={(open) => {
                    if (!open) {
                        appConfirm?.onCancel?.();
                    }
                }}
            />

            <LessonConfirmDialog
                open={Boolean(appChoice)}
                title={appChoice?.title || ''}
                description={appChoice?.description || ''}
                icon={appChoice?.icon || 'warning'}
                buttons={appChoice?.buttons || []}
                onOpenChange={(open) => {
                    if (!open) {
                        appChoice?.onCancel?.();
                    }
                }}
            />
        </>
    );
}
