using UnityEngine;

public enum WeaponType
{
    SingleShot,
    Shotgun,
    RapidFire
}

public class WeaponController : MonoBehaviour
{
    [System.Serializable]
    public class WeaponData
    {
        public WeaponType type;
        public GameObject projectilePrefab;
        public float fireRate;
        public float projectileSpeed;
        public int projectilesPerShot;
        public float spreadAngle;
    }

    [SerializeField] private WeaponData[] weapons;
    [SerializeField] private Transform firePoint;
    
    private int currentWeaponIndex = 0;
    private float nextFireTime = 0f;
    private float damageMultiplier = 1f;
    
    void Update()
    {
        // 무기 전환
        if (Input.GetKeyDown(KeyCode.Q))
        {
            SwitchWeapon();
        }

        // 발사
        if (Input.GetMouseButton(0) && Time.time >= nextFireTime)
        {
            Fire();
            nextFireTime = Time.time + weapons[currentWeaponIndex].fireRate;
        }
    }
    
    void Fire()
    {
        WeaponData weapon = weapons[currentWeaponIndex];
        
        switch (weapon.type)
        {
            case WeaponType.SingleShot:
                FireProjectile(weapon, 0f);
                break;
                
            case WeaponType.Shotgun:
                float angleStep = weapon.spreadAngle / (weapon.projectilesPerShot - 1);
                float startAngle = -weapon.spreadAngle / 2f;
                
                for (int i = 0; i < weapon.projectilesPerShot; i++)
                {
                    FireProjectile(weapon, startAngle + (angleStep * i));
                }
                break;
                
            case WeaponType.RapidFire:
                FireProjectile(weapon, Random.Range(-weapon.spreadAngle, weapon.spreadAngle));
                break;
        }
    }
    
    void FireProjectile(WeaponData weapon, float angleOffset)
    {
        // 발사 각도 계산 (2D)
        float angle = transform.eulerAngles.z + angleOffset;
        Quaternion rotation = Quaternion.Euler(0, 0, angle);
        
        // 프로젝타일 생성
        GameObject projectile = Instantiate(weapon.projectilePrefab, firePoint.position, rotation);
        Rigidbody2D projectileRb = projectile.GetComponent<Rigidbody2D>();
        
        if (projectileRb != null)
        {
            Vector2 direction = rotation * Vector2.right;
            projectileRb.velocity = direction * weapon.projectileSpeed;
        }
        
        // 프로젝타일에 데미지 배율 적용
        Projectile projectileScript = projectile.GetComponent<Projectile>();
        if (projectileScript != null)
        {
            projectileScript.SetDamageMultiplier(damageMultiplier);
        }
        
        Destroy(projectile, 5f);
    }
    
    void SwitchWeapon()
    {
        currentWeaponIndex = (currentWeaponIndex + 1) % weapons.Length;
    }
    
    public void SetDamageMultiplier(float multiplier)
    {
        damageMultiplier = multiplier;
    }

}