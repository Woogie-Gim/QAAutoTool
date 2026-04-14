import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const App = () => {
  // 측정 상태 관리
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 모니터링 토글 핸들러
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QA Auto Tool</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.statusText}>
          상태: {isMonitoring ? '측정 중 🟢' : '대기 중 ⚪'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isMonitoring ? styles.buttonStop : styles.buttonStart]} 
        onPress={toggleMonitoring}
      >
        <Text style={styles.buttonText}>
          {isMonitoring ? '측정 중지' : '측정 시작'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#282C34',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;