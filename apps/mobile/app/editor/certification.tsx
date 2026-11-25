import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useMyProfile, useRemoveListItem, useSaveListItem } from '@/api/hooks';
import { EditorShell, withProfileLoaded } from '@/features/handyman/EditorShell';
import { Banner, DocumentPicker, MonthYearField, TextField, useToast } from '@/ui';

function CertificationEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useMyProfile();
  const existing = data?.profile.certifications.find((c) => c._id === id);
  const save = useSaveListItem('certifications');
  const remove = useRemoveListItem('certifications');
  const toast = useToast();

  const [name, setName] = useState(existing?.name ?? '');
  const [issuer, setIssuer] = useState(existing?.issuer ?? '');
  const [number, setNumber] = useState(existing?.number ?? '');
  const [issuedAt, setIssuedAt] = useState<string | null>(existing?.issuedAt ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(existing?.expiresAt ?? null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(existing?.documentUrl ?? null);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setTried(true);
    if (!name.trim()) return;
    setError(null);
    try {
      await save.mutateAsync({
        id,
        input: {
          name: name.trim(),
          issuer: issuer.trim(),
          number: number.trim(),
          issuedAt: issuedAt ?? undefined,
          expiresAt: expiresAt ?? undefined,
          documentUrl: documentUrl ?? undefined,
        },
      });
      toast(id ? 'Certification updated' : 'Certification added');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <EditorShell
      title={id ? 'Edit certification' : 'Add certification'}
      onSave={submit}
      saving={save.isPending}
      error={error}
      onDelete={id ? () => remove.mutateAsync(id) : undefined}
      deleteLabel="this certification"
    >
      {existing?.verified && <Banner tone="info" message="Changing a verified certification sends it back for review." />}
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. PIRB Licensed Plumber, Wireman's Licence"
        maxLength={120}
        error={tried && !name.trim() ? 'Add the certification name' : null}
      />
      <TextField label="Issued by" optional value={issuer} onChangeText={setIssuer} placeholder="e.g. PIRB, Department of Labour, SETA" maxLength={120} />
      <TextField label="Registration / certificate number" optional value={number} onChangeText={setNumber} hint="Only our team sees this number." maxLength={60} />
      <MonthYearField label="Issued" optional value={issuedAt} onChange={setIssuedAt} />
      <MonthYearField label="Expires" optional value={expiresAt} onChange={setExpiresAt} allowFuture />
      <DocumentPicker
        kind="certificate"
        label="Certificate photo"
        hint="Optional · needed for the verified badge"
        icon="document-text-outline"
        value={documentUrl}
        onChange={setDocumentUrl}
      />
    </EditorShell>
  );
}

export default withProfileLoaded(CertificationEditor);
