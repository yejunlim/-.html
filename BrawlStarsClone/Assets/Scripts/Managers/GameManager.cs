using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private Transform[] spawnPoints;
    [SerializeField] private float matchDuration = 180f; // 3분
    
    private float currentMatchTime;
    private List<PlayerController> activePlayers = new List<PlayerController>();
    private bool isGameActive = false;
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void Start()
    {
        StartMatch();
    }
    
    void Update()
    {
        if (isGameActive)
        {
            currentMatchTime -= Time.deltaTime;
            
            if (currentMatchTime <= 0)
            {
                EndMatch();
            }
            
            // 승리 조건 체크
            CheckWinCondition();
        }
    }
    
    public void StartMatch()
    {
        isGameActive = true;
        currentMatchTime = matchDuration;
        SpawnPlayers();
    }
    
    private void SpawnPlayers()
    {
        // 테스트를 위한 단일 플레이어 스폰
        if (spawnPoints.Length > 0)
        {
            GameObject player = Instantiate(playerPrefab, spawnPoints[0].position, spawnPoints[0].rotation);
            PlayerController playerController = player.GetComponent<PlayerController>();
            if (playerController != null)
            {
                activePlayers.Add(playerController);
            }
        }
    }
    
    private void CheckWinCondition()
    {
        // 생존한 플레이어가 1명 이하일 경우 게임 종료
        if (activePlayers.Count <= 1)
        {
            EndMatch();
        }
    }
    
    public void EndMatch()
    {
        isGameActive = false;
        
        // 승자 결정 및 결과 화면 표시
        if (activePlayers.Count == 1)
        {
            Debug.Log("Winner: " + activePlayers[0].gameObject.name);
        }
        else
        {
            Debug.Log("Draw!");
        }
        
        // 3초 후 메인 메뉴로 돌아가기
        Invoke("ReturnToMainMenu", 3f);
    }
    
    private void ReturnToMainMenu()
    {
        SceneManager.LoadScene("MainMenu");
    }
    
    public void PlayerEliminated(PlayerController player)
    {
        if (activePlayers.Contains(player))
        {
            activePlayers.Remove(player);
            CheckWinCondition();
        }
    }
}