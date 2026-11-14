import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/auth/require-admin';

const toIsoString = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return '';
};

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const snapshot = await adminDb
      .collection('newsletter')
      .orderBy('subscribedAt', 'desc')
      .get();

    const subscribers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        locale: data.locale,
        subscribedAt: toIsoString(data.subscribedAt),
      };
    });

    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('Admin newsletter fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await request.json();
    if (typeof id !== 'string' || !id || id.includes('/')) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    await adminDb.collection('newsletter').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin newsletter delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}
