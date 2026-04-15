import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  NativeModules,
  Alert,
} from 'react-native';

// 우리가 만든 네이티브 모듈 가져오기
const { QAAutoModule } = NativeModules;

function App(): React.JSX.Element {
  const [status, setStatus] = useState('대기 중');
  const [loading, setLoading] = useState(false);
  const [memInfo, setMemInfo] = useState('');

  const startMeasurement = async () => {
    setLoading(true);
    setStatus('측정 중...');
    
    try {
      // Shizuku 권한 체크
      const hasPermission = await QAAutoModule.checkPermission();
      
      if (!hasPermission) {
        Alert.alert('권한 필요', 'Shizuku 앱에서 권한을 허용해주세요.');
        setStatus('권한 없음');
        setLoading(false);
        return;
      }

      // dumpsys 실행 (예시로 안드로이드 시스템 UI 패키지 정보 조회)
      const result = await QAAutoModule.runDumpsys('com.android.systemui');
      setMemInfo(result);
      setStatus('측정 완료');
    } catch (e: any) {
      console.error(e);
      setStatus('에러 발생');
      Alert.alert('에러', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QA Auto Tool</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.statusText}>
          상태: {status} {loading ? '⏳' : '✅'}
        </Text>
        
        {/* 메모리 정보를 보여줄 스크롤 뷰 */}
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {memInfo || '측정 시작 버튼을 눌러 데이터를 가져오세요.'}
          </Text>
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={startMeasurement}
        disabled={loading}
      >
        <Text style={styles.buttonText}>측정 시작</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { height: 60, backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  statusText: { fontSize: 18, marginBottom: 20, color: '#333' },
  resultContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: { fontSize: 12, fontFamily: 'monospace', color: '#444' },
  button: {
    backgroundColor: '#007AFF',
    margin: 20,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default App;