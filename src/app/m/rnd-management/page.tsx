"use client";

import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { 
  Award, ShieldAlert, Camera, Mic, CheckCircle, AlertTriangle, 
  ArrowLeft, RefreshCw, Upload, Sparkles, Send, Play, Square
} from 'lucide-react';
import Link from 'next/link';

export default function RndMobilePage() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 모바일 공간 촬영 업로드 관련 상태
  const [signageImage, setSignageImage] = useState<string>('');
  const [layoutImage, setLayoutImage] = useState<string>('');
  const [isAnalyzingSpace, setIsAnalyzingSpace] = useState(false);
  const [spaceAnalysisResult, setSpaceAnalysisResult] = useState<any>(null);

  // 모바일 음성 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<any>(null);
  const [voiceText, setVoiceText] = useState('');
  const [isGeneratingLog, setIsGeneratingLog] = useState(false);
  const [aiGeneratedLog, setAiGeneratedLog] = useState<any>(null);

  // 데이터 로드
  const fetchMobileData = async () => {
    setLoading(true);
    try {
      const alarmsRes = await apiFetch('/api/rnd?type=alarms').then(r => r.json());
      if (alarmsRes.success) {
        setAlarms(alarmsRes.alarms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobileData();
  }, []);

  // 타이머 작동 (녹음 시뮬레이션)
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
    } else {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimer) clearInterval(recordingTimer);
    };
  }, [isRecording]);

  // 이미지 캡처 변환 시뮬레이터
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'signage' | 'layout') => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (imageType === 'signage') {
        setSignageImage(previewUrl);
      } else {
        setLayoutImage(previewUrl);
      }
      setSpaceAnalysisResult(null); // 신규 업로드 시 기존 결과 리셋
    }
  };

  // 비전 AI 공간 적격성 검증 실행
  const handleAnalyzeSpace = async () => {
    if (!signageImage && !layoutImage) {
      alert('출입구 현판 또는 내부 연구 공간 사진을 카메라로 찍어주세요.');
      return;
    }
    setIsAnalyzingSpace(true);
    setSpaceAnalysisResult(null);

    try {
      const res = await apiFetch('/api/rnd/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entrance_image: signageImage || null,
          layout_image: layoutImage || null
        })
      }).then(r => r.json());

      if (res.success) {
        setSpaceAnalysisResult(res.analysis);

        // 자가진단 데이터를 DB에 저장(setup-db.ts / api/rnd POST에 space_add 연동)
        await apiFetch('/api/rnd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'space_add',
            data: {
              check_date: res.analysis.check_date,
              image_url_entrance: signageImage || '/images/rnd/entrance.jpg',
              image_url_layout: layoutImage || '/images/rnd/layout.jpg',
              ai_analysis_result: res.analysis,
              signage_status: res.analysis.signage_status,
              partition_status: res.analysis.partition_status,
              overall_status: res.analysis.overall_status,
              inspector_notes: res.analysis.inspector_notes
            }
          })
        });

        fetchMobileData(); // 알림 상태 갱신
      } else {
        alert(res.error || '분석 과정 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('서버 비전 엔진 연결 실패');
    } finally {
      setIsAnalyzingSpace(false);
    }
  };

  // 녹음 시작/중지 시뮬레이터
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setVoiceText('');
      setAiGeneratedLog(null);
    } else {
      setIsRecording(false);
      // 가짜 STT 텍스트 생성
      setVoiceText("오늘 R&D 센터 내부에서 YOLOv8 모델 바운딩 박스 IoU 임계치 임계값을 0.5에서 0.6으로 상향 조정하고 파티션 정밀도 측정을 수행했어. 오탑지율이 대폭 감소하는 결과를 도출했지.");
    }
  };

  // AI 연구일지 생성 의뢰
  const handleGenerateLog = async () => {
    if (!voiceText) return;
    setIsGeneratingLog(true);
    setAiGeneratedLog(null);

    try {
      const res = await apiFetch('/api/rnd/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'VOICE', content: voiceText })
      }).then(r => r.json());

      if (res.success) {
        setAiGeneratedLog(res.ai_draft);
      } else {
        alert(res.error || 'AI 초안 생성 실패');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingLog(false);
    }
  };

  // 일지 결재 상정
  const handleSaveLog = async () => {
    if (!aiGeneratedLog) return;
    try {
      const res = await apiFetch('/api/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'log_add',
          data: {
            author_id: 3, // 박영희 연구원
            work_date: new Date().toISOString().slice(0, 10),
            raw_source: 'VOICE',
            raw_content: voiceText,
            ai_generated_title: aiGeneratedLog.title,
            ai_generated_content: aiGeneratedLog.content,
            approval_status: 'PENDING'
          }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('모바일 음성 기반 연구일지가 결재선에 상신되었습니다.');
        setVoiceText('');
        setAiGeneratedLog(null);
      } else {
        alert(res.error || '저장 오류');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">모바일 연구소 포탈 로딩 중...</p>
      </div>
    );
  }

  const activeAlarms = alarms.filter(a => a.is_resolved === 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      {/* 헤더 */}
      <div className="bg-slate-900 text-white p-4 flex items-center space-x-3 sticky top-0 z-30 shadow-md">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center space-x-2">
          <Award className="w-6 h-6 text-amber-500" />
          <span className="font-bold text-base">이지봇 연구소 실사비서</span>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 max-w-md mx-auto w-full">
        {/* 1. 컴플라이언스 경보 배너 */}
        {activeAlarms.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-red-900">지정 취소/경보 주의보 ({activeAlarms.length}건)</span>
              <p className="text-red-700 leading-relaxed font-medium">
                {activeAlarms[0].message}
              </p>
            </div>
          </div>
        )}

        {/* 2. 공간 비전 AI 촬영 자가진단 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <span>연구소 공간 AI 자가진단</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">현장 실사 규정 준수를 위해 연구소 외부 현판과 내부 파티션을 모바일로 직접 촬영해 진단하세요.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 현판 사진 촬영 */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-3 text-center relative flex flex-col justify-between h-32 cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => handleCameraCapture(e, 'signage')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {signageImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signageImage} alt="현판 미리보기" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="my-auto space-y-1">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-500 font-bold block">1. 입구 현판 촬영</span>
                  <span className="text-[8px] text-slate-400">('기업부설연구소' 명시)</span>
                </div>
              )}
            </div>

            {/* 내부 파티션 촬영 */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-3 text-center relative flex flex-col justify-between h-32 cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => handleCameraCapture(e, 'layout')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {layoutImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={layoutImage} alt="파티션 미리보기" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="my-auto space-y-1">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-500 font-bold block">2. 연구 구획 촬영</span>
                  <span className="text-[8px] text-slate-400">(파티션 높이 측정)</span>
                </div>
              )}
            </div>
          </div>

          {(signageImage || layoutImage) && !spaceAnalysisResult && (
            <button 
              onClick={handleAnalyzeSpace}
              disabled={isAnalyzingSpace}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingSpace ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingSpace ? 'Vision AI 공간적격성 진단 중...' : '적격성 진단 요청하기'}</span>
            </button>
          )}

          {/* 비전 진단 결과 리포트 */}
          {spaceAnalysisResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${spaceAnalysisResult.overall_status === '합격' ? 'bg-green-50/50 border-green-100 text-green-950' : 'bg-amber-50/50 border-amber-100 text-amber-950'}`}>
              <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
                <span className="font-bold">자가 실사 AI 판정 결과</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${spaceAnalysisResult.overall_status === '합격' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                  {spaceAnalysisResult.overall_status}
                </span>
              </div>
              <div className="space-y-1 font-medium text-slate-600">
                <p>• 현판 부착: {spaceAnalysisResult.signage_status === 'PASS' ? '합격(확인)' : '부적격(미지정)'}</p>
                <p>• 파티션 규격: {spaceAnalysisResult.estimated_partition_height_m}m ({spaceAnalysisResult.partition_status === 'PASS' ? '1.2m 이상 합격' : '미달 보완요구'})</p>
                <p className="text-[11px] text-slate-500 italic border-t pt-2 mt-2 leading-relaxed bg-white/70 p-2 rounded-lg">
                  "{spaceAnalysisResult.inspector_notes}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. 모바일 구두 음성 녹음 연구일지 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Mic className="w-5 h-5 text-indigo-500" />
              <span>구두 녹음으로 R&D 연구일지 작성</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">오늘 진행한 연구개발 실험/수행내용을 10초 내외로 구두 녹음하면 AI가 학술 템플릿 일지로 작문해 줍니다.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
            <button 
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse scale-105' : 'bg-indigo-600 text-white hover:scale-102 shadow-md shadow-indigo-500/10'}`}
            >
              {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
            </button>
            <div className="text-center">
              <span className={`text-xs font-bold ${isRecording ? 'text-red-500' : 'text-slate-500'}`}>
                {isRecording ? `녹음 중... (${recordingSeconds}초)` : '마이크 버튼을 눌러 말하기'}
              </span>
              {voiceText && !isRecording && (
                <p className="text-[10px] text-slate-400 mt-1">✓ 음성 텍스트 수집 완료</p>
              )}
            </div>
          </div>

          {/* 수집된 말소리 STT 프리뷰 */}
          {voiceText && !isRecording && (
            <div className="space-y-3">
              <div className="bg-slate-50/50 border p-3 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1 text-[9px]">STT 수집 원문:</span>
                "{voiceText}"
              </div>

              {!aiGeneratedLog && (
                <button 
                  onClick={handleGenerateLog}
                  disabled={isGeneratingLog}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-sm disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingLog ? 'AI 연구일지 정밀 가공 중...' : 'AI 연구일지 변환하기'}</span>
                </button>
              )}
            </div>
          )}

          {/* AI 생성 모바일 템플릿 프리뷰 */}
          {aiGeneratedLog && (
            <div className="border border-indigo-100 bg-indigo-50/20 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-700">AI 편찬 초안 완성</span>
                <span className="text-[10px] text-slate-400">결재 요청 대기</span>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-800 leading-normal">과제: {aiGeneratedLog.title}</p>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  {aiGeneratedLog.content}
                </div>
              </div>
              <button 
                onClick={handleSaveLog}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>연구소장 결재 올리기</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
