import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
  Alert,
  ScrollView,
} from 'react-native';

const { QAAutoModule } = NativeModules;

function App(): React.JSX.Element {
  const [status, setStatus] = useState('대기 중');
  const [loading, setLoading] = useState(false);

  // 측정 데이터 State
  const [currentMem, setCurrentMem] = useState<number | null>(null);
  const [maxMem, setMaxMem] = useState<number>(0);
  const [minMem, setMinMem] = useState<number>(9999999);
  const [cpuUsage, setCpuUsage] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  
  // 복사를 위한 전체 원본 로그 저장 State
  const [rawLogData, setRawLogData] = useState<string>('');

  const parseTotalMemory = (rawText: string) => {
    const match = rawText.match(/TOTAL:\s+(\d+)/i);
    return match ? parseFloat((parseInt(match[1], 10) / 1024).toFixed(2)) : null;
  };
  const parseCpuUsage = (rawText: string) => {
    const match = rawText.match(/(\d+)%\s+TOTAL/i);
    return match ? parseInt(match[1], 10) : null;
  };
  const parseTemperature = (rawText: string) => {
    const match = rawText.match(/temperature:\s+(\d+)/i);
    return match ? parseInt(match[1], 10) / 10 : null;
  };

  const startMeasurement = async () => {
    setLoading(true);
    setStatus('측정 중...');

    try {
      const hasPermission = await QAAutoModule.checkPermission();
      if (!hasPermission) {
        setStatus('권한 없음');
        setLoading(false);
        return;
      }

      const memRaw = await QAAutoModule.runShellCommand('dumpsys meminfo com.android.systemui');
      const cpuRaw = await QAAutoModule.runShellCommand('dumpsys cpuinfo');
      const batRaw = await QAAutoModule.runShellCommand('dumpsys battery');

      // 원본 로그 합쳐서 저장 (전체 복사용)
      setRawLogData(`[Memory Log]\n${memRaw}\n\n[CPU Log]\n${cpuRaw}`);

      // 데이터 파싱
      const memMB = parseTotalMemory(memRaw);
      if (memMB) {
        setCurrentMem(memMB);
        setMaxMem(prev => Math.max(prev, memMB));
        setMinMem(prev => (prev === 9999999 ? memMB : Math.min(prev, memMB)));
      }
      setCpuUsage(parseCpuUsage(cpuRaw));
      setTemperature(parseTemperature(batRaw));

      setStatus('측정 완료 ✅');
    } catch (e: any) {
      console.error(e);
      setStatus('에러 발생');
      Alert.alert('에러', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 복사 기능 핸들러
  const handleCopy = async (type: 'PARSED' | 'RAW') => {
    if (!currentMem && !rawLogData) {
      Alert.alert('알림', '먼저 데이터를 수집해주세요!');
      return;
    }

    let textToCopy = '';

    if (type === 'PARSED') {
      textToCopy = `[ QA 자동화 측정 리포트 ]
- 시스템 메모리: ${currentMem} MB (최고: ${maxMem} MB / 최저: ${minMem} MB)
- CPU 점유율: ${cpuUsage} %
- 기기 발열: ${temperature} °C
- 측정 일시: ${new Date().toLocaleString()}`;
    } else {
      textToCopy = rawLogData;
    }

    try {
      await QAAutoModule.copyToClipboard(textToCopy);
      Alert.alert('복사 완료!', type === 'PARSED' ? '파싱된 요약 데이터가 복사되었습니다.' : '전체 원본 로그가 복사되었습니다.');
    } catch (e) {
      Alert.alert('복사 실패', '클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QA Auto Tool (Phase 1)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.statusText}>상태: {status}</Text>
        
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitle}>[ 실시간 리소스 대시보드 ]</Text>
          <StatRow label="현재 메모리" value={currentMem ? `${currentMem} MB` : '-'} highlight />
          <StatRow label="최고 메모리 (Max)" value={maxMem > 0 ? `${maxMem} MB` : '-'} color="#e74c3c" />
          <StatRow label="최저 메모리 (Min)" value={minMem !== 9999999 ? `${minMem} MB` : '-'} color="#3498db" />
          <StatRow label="CPU 사용량" value={cpuUsage ? `${cpuUsage} %` : '-'} />
          <StatRow label="배터리 온도" value={temperature ? `${temperature} °C` : '-'} color={temperature && temperature >= 40 ? '#e74c3c' : '#333'} />
        </View>

        {/* 복사 버튼 영역 */}
        <View style={styles.copyButtonContainer}>
          <TouchableOpacity style={[styles.copyButton, styles.copyButtonParsed]} onPress={() => handleCopy('PARSED')}>
            <Text style={styles.copyButtonText}>요약 데이터 복사</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.copyButton, styles.copyButtonRaw]} onPress={() => handleCopy('RAW')}>
            <Text style={styles.copyButtonText}>전체 로그 복사</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={startMeasurement} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '데이터 수집 중...' : '데이터 수집'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const StatRow = ({ label, value, color = '#333', highlight = false }: any) => (
  <View style={styles.statsRow}>
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={[highlight ? styles.statValueHighlight : styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  // 전체 배경 및 하단 안전 여백 확보
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 30,
  },
  // 상단 헤더 영역
  header: {
    height: 60,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 헤더 텍스트
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // 메인 스크롤 영역 반응형 확장
  content: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  // 상태 메시지 텍스트
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
  },
  // 대시보드 카드 UI
  dashboard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  // 대시보드 제목
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  // 개별 스탯 행 디자인
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // 스탯 라벨 텍스트
  statLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  // 스탯 수치 텍스트
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 강조용 스탯 수치 텍스트
  statValueHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  // 복사 버튼 그룹 컨테이너
  copyButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  // 개별 복사 버튼 공통
  copyButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  // 요약 복사 버튼 색상
  copyButtonParsed: {
    backgroundColor: '#2ecc71',
  },
  // 원본 복사 버튼 색상
  copyButtonRaw: {
    backgroundColor: '#7f8c8d',
  },
  // 복사 버튼 텍스트
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // 메인 데이터 수집 버튼
  button: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  // 비활성화 상태 버튼 색상
  buttonDisabled: {
    backgroundColor: '#999',
  },
  // 메인 버튼 텍스트
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;