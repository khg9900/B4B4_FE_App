import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { userApi } from '../api/userApi';
import type { SignUpRequestDto, UserRole } from '../types/User';
import { useNavigation } from '@react-navigation/native';

const SignUpScreen = () => {
  const navigation = useNavigation();

  const [form, setForm] = useState<SignUpRequestDto>({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    province: '',
    userRole: 'IND',
    loginType: 'LOCAL', // 기본값
  });

  const handleSubmit = async () => {
    try {
      await userApi.signUp(form);
      Alert.alert('회원가입 성공');
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error(error);
      Alert.alert('회원가입 실패', '입력값을 다시 확인해주세요');
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
      />
      <TextInput
        placeholder="비밀번호"
        style={styles.input}
        secureTextEntry
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
      />
      <TextInput
        placeholder="이름"
        style={styles.input}
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
      />
      <TextInput
        placeholder="전화번호"
        style={styles.input}
        keyboardType="phone-pad"
        value={form.phoneNumber}
        onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
      />
      <Button title="회원가입" onPress={handleSubmit} />
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
  },
});

export default SignUpScreen;