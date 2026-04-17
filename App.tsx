import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
  Alert,
} from 'react-native';

const { QAAutoModule } = NativeModules;

function App(): React.JSX.Element {
  const [status, setStatus] = useState('대기 중');
  const [loading, setLoading] = useState(false);

  // 📊 통계용 State
  const [currentMem, setCurrentMem] = useState<number | null>(null);
  const [maxMem, setMaxMem] = useState<number>(0);
  const [minMem, setMinMem] = useState<number>(9999999);
  const [memHistory, setMemHistory] = useState<number[]>([]);

  // 텍스트에서 'TOTAL' 메모리 숫자만 뽑아내는 정규표현식 함수
  const parseTotalMemory = (rawText: string): number | null => {
    // "TOTAL:   12345" 형태에서 숫자만 추출 (KB 단위)
    const match = rawText.match(/TOTAL:\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const startMeasurement = async () => {
    setLoading(true);
    setStatus('측정 중...');

    try {
      const hasPermission = await QAAutoModule.checkPermission();
      if (!hasPermission) {
        Alert.alert('권한 필요', 'Shizuku 앱에서 권한을 허용해주세요.');
        setStatus('권한 없음');
        setLoading(false);
        return;
      }

      // 시스템 UI(또는 타겟 게임)의 메모리 정보 가져오기
      const rawData = await QAAutoModule.runDumpsys('com.android.systemui');
      
      // 1. 파싱 (숫자 추출)
      const parsedMem = parseTotalMemory(rawData);

      if (parsedMem !== null) {
        const memMB = parseFloat((parsedMem / 1024).toFixed(2)); // KB -> MB 변환

        // 2. 통계 계산
        setCurrentMem(memMB);
        setMaxMem((prev) => Math.max(prev, memMB));
        // 처음 측정 시 min 값이 9999999에서 현재 값으로 갱신되도록 처리
        setMinMem((prev) => (prev === 9999999 ? memMB : Math.min(prev, memMB)));
        
        // 히스토리에 추가하여 평균 계산
        setMemHistory((prev) => {
          const newHistory = [...prev, memMB];
          return newHistory;
        });

        setStatus('측정 완료');
      } else {
        setStatus('파싱 실패 (TOTAL 값 없음)');
      }
    } catch (e: any) {
      console.error(e);
      setStatus('에러 발생');
      Alert.alert('에러', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 평균값 계산 (배열의 합 / 배열 길이)
  const avgMem = memHistory.length > 0 
    ? (memHistory.reduce((a, b) => a + b, 0) / memHistory.length).toFixed(2) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QA Auto Tool (Phase 1)</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.statusText}>
          상태: {status} {loading ? '⏳' : '✅'}
        </Text>
        
        {/* 📊 통계 대시보드 */}
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitle}>[ System UI 메모리 (MB) ]</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>현재:</Text>
            <Text style={styles.statValueHighlight}>{currentMem ? `${currentMem} MB` : '-'}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>최고 (Max):</Text>
            <Text style={[styles.statValue, { color: '#e74c3c' }]}>{maxMem > 0 ? `${maxMem} MB` : '-'}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>최저 (Min):</Text>
            <Text style={[styles.statValue, { color: '#3498db' }]}>{minMem !== 9999999 ? `${minMem} MB` : '-'}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>평균 (Avg):</Text>
            <Text style={[styles.statValue, { color: '#2ecc71' }]}>{memHistory.length > 0 ? `${avgMem} MB` : '-'}</Text>
          </View>
          <Text style={styles.historyCount}>총 측정 횟수: {memHistory.length}회</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={startMeasurement}
        disabled={loading}
      >
        <Text style={styles.buttonText}>데이터 수집 (1회)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { height: 60, backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  statusText: { fontSize: 16, marginBottom: 20, color: '#333', fontWeight: '600' },
  dashboard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 15, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  dashboardTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#2c3e50' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statLabel: { fontSize: 16, color: '#555', fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statValueHighlight: { fontSize: 20, fontWeight: 'bold', color: '#8e44ad' },
  historyCount: { marginTop: 15, textAlign: 'right', fontSize: 12, color: '#999' },
  button: { backgroundColor: '#007AFF', margin: 20, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonDisabled: { backgroundColor: '#999', shadowOpacity: 0 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default App;