import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { userApi } from '../api/userApi';
import type { SignUpRequestDto } from '../types/User';
import { useNavigation } from '@react-navigation/native';
import { showErrorAlert, ErrorCode } from '../../global/utils/showErrorAlert';

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

const SignUpScreen = () => {
  const navigation = useNavigation();

  const [form, setForm] = useState<SignUpRequestDto>({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    userRole: 'IND',
  });

  const handleSubmit = async () => {
    try {
      await userApi.signUp(form);
      Alert.alert('회원가입 성공');
      navigation.navigate('Login' as never);
    } catch (error: any) {
      const serverError = error?.response?.data;
      logError('회원가입 실패', error);

      showErrorAlert(
        serverError?.code as ErrorCode,
        serverError?.payload
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        placeholder="이메일"
        style={styles.input}
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="비밀번호"
        style={styles.input}
        secureTextEntry
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="이름"
        style={styles.input}
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="전화번호"
        style={styles.input}
        keyboardType="phone-pad"
        value={form.phoneNumber}
        onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    color: '#000',
  },
  button: {
    backgroundColor: '#f26522',
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    height: 53,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default SignUpScreen;
