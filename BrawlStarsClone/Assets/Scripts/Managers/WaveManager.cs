using UnityEngine;
using System.Collections;
using UnityEngine.Events;

public class WaveManager : MonoBehaviour
{
    [System.Serializable]
    public class Wave
    {
        public GameObject[] enemyPrefabs;
        public int enemyCount;
        public float spawnInterval;
        public float waveDuration;
        public float difficultyMultiplier = 1f;
    }
    
    [SerializeField] private Wave[] waves;
    [SerializeField] private Transform[] spawnPoints;
    [SerializeField] private float timeBetweenWaves = 5f;
    
    public UnityEvent<int> onWaveStart;
    public UnityEvent<int> onWaveComplete;
    public UnityEvent onAllWavesComplete;
    
    private int currentWave = 0;
    private int enemiesAlive = 0;
    private bool isSpawning = false;
    
    void Start()
    {
        StartCoroutine(StartWaveRoutine());
    }
    
    IEnumerator StartWaveRoutine()
    {
        while (currentWave < waves.Length)
        {
            yield return new WaitForSeconds(timeBetweenWaves);
            
            onWaveStart?.Invoke(currentWave + 1);
            yield return StartCoroutine(SpawnWave());
            
            // 웨이브의 모든 적이 처치될 때까지 대기
            while (enemiesAlive > 0)
            {
                yield return null;
            }
            
            onWaveComplete?.Invoke(currentWave + 1);
            currentWave++;
        }
        
        onAllWavesComplete?.Invoke();
    }
    
    IEnumerator SpawnWave()
    {
        Wave wave = waves[currentWave];
        isSpawning = true;
        
        float elapsedTime = 0f;
        int enemiesSpawned = 0;
        
        while (elapsedTime < wave.waveDuration && enemiesSpawned < wave.enemyCount)
        {
            SpawnEnemy(wave);
            enemiesSpawned++;
            enemiesAlive++;
            
            yield return new WaitForSeconds(wave.spawnInterval);
            elapsedTime += wave.spawnInterval;
        }
        
        isSpawning = false;
    }
    
    void SpawnEnemy(Wave wave)
    {
        // 랜덤한 적 프리팹과 스폰 포인트 선택
        GameObject enemyPrefab = wave.enemyPrefabs[Random.Range(0, wave.enemyPrefabs.Length)];
        Transform spawnPoint = spawnPoints[Random.Range(0, spawnPoints.Length)];
        
        // 적 생성 및 난이도 설정
        GameObject enemy = Instantiate(enemyPrefab, spawnPoint.position, spawnPoint.rotation);
        
        // 적의 체력과 공격력을 웨이브에 따라 조정
        Health enemyHealth = enemy.GetComponent<Health>();
        if (enemyHealth != null)
        {
            enemyHealth.onDeath.AddListener(OnEnemyDeath);
        }
        
        EnemyController enemyController = enemy.GetComponent<EnemyController>();
        if (enemyController != null)
        {
            enemyController.SetDifficultyMultiplier(wave.difficultyMultiplier);
        }
    }
    
    void OnEnemyDeath()
    {
        enemiesAlive--;
    }
    
    public int GetCurrentWave()
    {
        return currentWave + 1;
    }
    
    public int GetRemainingEnemies()
    {
        return enemiesAlive;
    }
}