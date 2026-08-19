'use client';

import { ApiError, db, requireUserId } from './supabase';

const BUCKET = 'checkin-photos';
const MAX_BYTES = 8 * 1024 * 1024;

export interface UploadedPhoto {
  /** 화면에 바로 표시할 서명 URL */
  url: string;
  /** DB에 저장할 경로 */
  path: string;
}

export const storageService = {
  /**
   * 체크인 사진 업로드.
   * 사진은 언제나 '선택'이다. 실패해도 체크인 자체는 막지 않는다.
   * 버킷은 비공개이고, 폴더 첫 조각이 본인 uid일 때만 정책을 통과한다.
   */
  async uploadCheckinPhoto(file: File, day: number): Promise<UploadedPhoto> {
    if (!file.type.startsWith('image/')) {
      throw new ApiError('INVALID_PARAM', '이미지 파일만 첨부할 수 있습니다.', 422);
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError('FILE_TOO_LARGE', '8MB 이하 이미지만 첨부할 수 있습니다.', 422);
    }

    const userId = await requireUserId();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/d${day}-${Date.now()}.${ext}`;

    const { error } = await db()
      .storage.from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new ApiError('UPLOAD_FAILED', '사진을 올리지 못했습니다.');

    const { data: signed } = await db().storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return { url: signed?.signedUrl ?? '', path };
  },

  /**
   * 저장된 경로들을 화면에서 쓸 수 있는 서명 URL로 바꾼다.
   *
   * 버킷이 비공개라 경로만으로는 이미지를 띄울 수 없다. 한 번에 묶어 요청해
   * 사진이 여러 장인 기록 화면에서 왕복이 늘어나지 않게 한다.
   * 실패한 경로는 조용히 빠진다 — 사진 하나 때문에 화면 전체가 막히면 안 된다.
   */
  async resolveUrls(paths: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const unique = Array.from(new Set(paths.filter(Boolean)));
    if (unique.length === 0) return result;

    const { data, error } = await db()
      .storage.from(BUCKET)
      .createSignedUrls(unique, 60 * 60);
    if (error || !data) return result;

    data.forEach((item) => {
      if (item.signedUrl && item.path) result.set(item.path, item.signedUrl);
    });
    return result;
  },
};
